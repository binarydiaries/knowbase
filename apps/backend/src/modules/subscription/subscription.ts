import { Elysia } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';
import { getDefaultProvider, getProvider } from './providers';

type OrgSubscriptionUpdate = {
  plan?: string;
  status?: string;
  provider?: string;
  providerSubscriptionId?: string;
  currentPeriodEnd?: Date | null;
  // null = clear the scheduled change fields
  scheduledPlan?: string | null;
  scheduledPlanAt?: Date | null;
  scheduledProviderSubscriptionId?: string | null;
};

async function upsertOrgSubscription(orgId: string, data: OrgSubscriptionUpdate) {
  // undefined = don't touch; null = explicitly set to null (clears the column)
  const defined = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
  await db
    .insert(orgSubscriptions)
    .values({ orgId, ...data })
    .onConflictDoUpdate({
      target: orgSubscriptions.orgId,
      set: { ...defined, updatedAt: new Date() },
    });
}

export const Subscription = new Elysia({
  prefix: '/subscriptions',
  tags: ['Subscription'],
})
  .use(SubscriptionModel)
  // PUBLIC — no auth, payment providers call this directly
  .post(
    '/webhook/:provider',
    async ({ params, request, set }) => {
      let provider;
      try {
        provider = getProvider(params.provider);
      } catch {
        set.status = 400;
        return { error: 'Unknown provider' };
      }

      const rawBody = await request.text();
      const signature = request.headers.get(provider.signatureHeader) ?? '';

      let event;
      try {
        event = provider.parseWebhook(rawBody, signature);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message ?? 'Webhook verification failed' };
      }

      if (!event) return { received: true };

      // Fetch current DB record to make routing decisions
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId: event.orgId } });

      if (event.status === 'cancelled' || event.status === 'completed') {
        if (
          record?.scheduledProviderSubscriptionId &&
          event.subscriptionId === record.providerSubscriptionId
        ) {
          // Old subscription cancelled as part of a scheduled plan change.
          // Don't reset plan — the scheduled subscription's activation webhook handles that.
          await upsertOrgSubscription(event.orgId, { status: 'transitioning' });
        } else {
          // Genuine cancellation / expiry — revert to free
          await upsertOrgSubscription(event.orgId, {
            plan: 'free',
            status: event.status,
            currentPeriodEnd: event.currentPeriodEnd ?? null,
            scheduledPlan: null,
            scheduledPlanAt: null,
            scheduledProviderSubscriptionId: null,
          });
        }
      } else if (event.status === 'active') {
        if (record?.scheduledProviderSubscriptionId === event.subscriptionId) {
          // The scheduled new plan is now live — promote it to the active subscription
          await upsertOrgSubscription(event.orgId, {
            plan: event.plan,
            status: 'active',
            providerSubscriptionId: event.subscriptionId,
            currentPeriodEnd: event.currentPeriodEnd ?? null,
            scheduledPlan: null,
            scheduledPlanAt: null,
            scheduledProviderSubscriptionId: null,
          });
        } else {
          // Regular activation or renewal
          await upsertOrgSubscription(event.orgId, {
            plan: event.plan,
            status: 'active',
            provider: params.provider,
            providerSubscriptionId: event.subscriptionId,
            currentPeriodEnd: event.currentPeriodEnd ?? null,
          });
        }
      } else {
        // halted, paused, etc. — update status only, keep plan
        await upsertOrgSubscription(event.orgId, {
          status: event.status,
          providerSubscriptionId: event.subscriptionId,
        });
      }

      return { received: true };
    },
  )
  .use(AuthGuard)
  .get(
    '/status',
    async ({ orgId }) => {
      return SubscriptionService.getStatus(orgId);
    },
    {
      response: 'SubscriptionStatusSchema',
    },
  )
  .post(
    '/checkout',
    async ({ body, orgId }) => {
      const { plan } = body;
      const provider = getDefaultProvider();

      const existing = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      // Already has a scheduled plan change in flight — prevent a second one
      if (existing?.scheduledProviderSubscriptionId) {
        throw new Error('A plan change is already scheduled. Cancel the scheduled change first.');
      }

      const isActiveSubscription =
        existing?.providerSubscriptionId &&
        ['active', 'authenticated', 'pending_cancellation'].includes(existing.status);

      if (isActiveSubscription) {
        // Option B: schedule the new plan to start at the end of the current billing period
        let periodEnd: Date | null = existing.currentPeriodEnd ?? null;

        if (!periodEnd) {
          // currentPeriodEnd not yet populated (first charge hasn't happened) — fetch live
          const existingProvider = getProvider(existing.provider ?? 'razorpay');
          periodEnd = await existingProvider.getSubscriptionPeriodEnd(existing.providerSubscriptionId!);
        }

        if (!periodEnd) {
          // Subscription exists but hasn't been charged yet (e.g. status=authenticated)
          // Fall through to immediate creation after cancelling the unstarted sub
          const existingProvider = getProvider(existing.provider ?? 'razorpay');
          await existingProvider.cancelSubscription(existing.providerSubscriptionId!);
        } else {
          // Schedule new subscription to start at period end
          const result = await provider.scheduleSubscription({ plan, orgId, startAt: periodEnd });

          // If currently active (not already pending cancellation), cancel old at period end
          if (existing.status === 'active' || existing.status === 'authenticated') {
            const existingProvider = getProvider(existing.provider ?? 'razorpay');
            await existingProvider.cancelSubscription(existing.providerSubscriptionId!, { atPeriodEnd: true });
          }

          await upsertOrgSubscription(orgId, {
            status: existing.status === 'pending_cancellation' ? 'pending_cancellation' : 'pending_cancellation',
            scheduledPlan: plan,
            scheduledPlanAt: periodEnd,
            scheduledProviderSubscriptionId: result.subscriptionId,
          });

          return {
            provider: provider.name,
            subscriptionId: result.subscriptionId,
            clientToken: result.clientToken,
            scheduledFor: periodEnd.toISOString(),
          };
        }
      }

      // No active subscription (or unstarted one just cancelled) — create immediately
      const result = await provider.createSubscription({ plan, orgId });

      await upsertOrgSubscription(orgId, {
        plan,
        status: 'created',
        provider: provider.name,
        providerSubscriptionId: result.subscriptionId,
      });

      return {
        provider: provider.name,
        subscriptionId: result.subscriptionId,
        clientToken: result.clientToken,
        scheduledFor: null,
      };
    },
    {
      body: 'CheckoutBodySchema',
      response: {
        200: 'CheckoutResponseSchema',
      },
    },
  )
  .post(
    '/cancel',
    async ({ orgId, set }) => {
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (!record?.providerSubscriptionId || record.status === 'pending_cancellation') {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');
      // Cancel at period end — user keeps access until their paid period expires
      await provider.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: true });

      await upsertOrgSubscription(orgId, { status: 'pending_cancellation' });

      return { success: true };
    },
    {
      response: { 200: 'CancelResponseSchema' },
    },
  )
  .post(
    '/resume',
    async ({ orgId, set }) => {
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (!record?.providerSubscriptionId || record.status !== 'pending_cancellation') {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');
      await provider.resumeSubscription(record.providerSubscriptionId);
      await upsertOrgSubscription(orgId, { status: 'active' });

      return { success: true };
    },
    {
      response: { 200: 'ResumeResponseSchema' },
    },
  )
  .post(
    '/cancel-scheduled-change',
    async ({ orgId, set }) => {
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (!record?.scheduledProviderSubscriptionId) {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');

      // Cancel the not-yet-started scheduled subscription immediately
      await provider.cancelSubscription(record.scheduledProviderSubscriptionId);

      // If the existing subscription was put into pending_cancellation as part of this change, undo it
      if (record.providerSubscriptionId && record.status === 'pending_cancellation') {
        await provider.resumeSubscription(record.providerSubscriptionId);
        await upsertOrgSubscription(orgId, {
          status: 'active',
          scheduledPlan: null,
          scheduledPlanAt: null,
          scheduledProviderSubscriptionId: null,
        });
      } else {
        await upsertOrgSubscription(orgId, {
          scheduledPlan: null,
          scheduledPlanAt: null,
          scheduledProviderSubscriptionId: null,
        });
      }

      return { success: true };
    },
    {
      response: { 200: 'CancelScheduledChangeResponseSchema' },
    },
  );
