import { Elysia } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';
import { getDefaultProvider, getProvider } from './providers';

type OrgSubscriptionUpdate = {
  plan?: string;
  status: string;
  provider?: string;
  providerSubscriptionId?: string;
  currentPeriodEnd?: Date | null;
};

async function upsertOrgSubscription(orgId: string, data: OrgSubscriptionUpdate) {
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

      await upsertOrgSubscription(event.orgId, {
        plan: event.plan,
        status: event.status,
        provider: params.provider,
        providerSubscriptionId: event.subscriptionId,
        currentPeriodEnd: event.currentPeriodEnd ?? null,
      });

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

      // Cancel any active subscription before creating a new one (upgrade / downgrade)
      const existing = await db.query.orgSubscriptions.findFirst({ where: { orgId } });
      if (existing?.providerSubscriptionId && ['active', 'authenticated', 'created'].includes(existing.status)) {
        const existingProvider = getProvider(existing.provider ?? 'razorpay');
        await existingProvider.cancelSubscription(existing.providerSubscriptionId);
      }

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
      const record = await db.query.orgSubscriptions.findFirst({
        where: { orgId },
      });

      if (!record?.providerSubscriptionId) {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');
      // Cancel at period end so the user keeps access until they've paid for
      await provider.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: true });

      // Mark as pending — plan stays as-is until the webhook fires subscription.cancelled
      await upsertOrgSubscription(orgId, {
        status: 'pending_cancellation',
      });

      return { success: true };
    },
    {
      response: {
        200: 'CancelResponseSchema',
      },
    },
  );
