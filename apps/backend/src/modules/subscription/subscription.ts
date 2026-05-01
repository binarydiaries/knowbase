import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { SubscriptionModel } from './model';
import { type PaidPlanName, PLAN_ORDER, PLANS } from './plans';
import {
  getDefaultProvider,
  getProvider,
  type PaymentProvider,
  type WebhookEvent,
} from './providers';
import { SubscriptionService } from './service';

type OrgSubscriptionUpdate = {
  plan?: string;
  status?: string;
  provider?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  lastPaymentId?: string | null;
};

async function upsertOrgSubscription(
  orgId: string,
  data: OrgSubscriptionUpdate,
) {
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
  // PUBLIC — no auth required
  .get(
    '/plans',
    () => ({
      plans: PLAN_ORDER.map((slug) => PLANS[slug]),
    }),
    { response: { 200: 'PlansResponseSchema' } },
  )
  .post('/webhook/:provider', async ({ params, request, set }) => {
    let provider: PaymentProvider;
    try {
      provider = getProvider(params.provider);
    } catch {
      set.status = 400;
      return { error: 'Unknown provider' };
    }

    const rawBody = await request.text();
    const signature = request.headers.get(provider.signatureHeader) ?? '';

    let event: WebhookEvent | null;
    try {
      event = provider.parseWebhook(rawBody, signature);
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Webhook verification failed' };
    }

    if (!event) return { received: true };

    if (event.status === 'cancelled' || event.status === 'completed') {
      await upsertOrgSubscription(event.orgId, {
        plan: 'free',
        status: event.status,
        currentPeriodStart: event.currentPeriodStart ?? null,
        currentPeriodEnd: event.currentPeriodEnd ?? null,
      });
    } else if (event.status === 'active') {
      await upsertOrgSubscription(event.orgId, {
        plan: event.plan,
        status: 'active',
        provider: params.provider,
        providerSubscriptionId: event.subscriptionId,
        currentPeriodStart: event.currentPeriodStart ?? null,
        currentPeriodEnd: event.currentPeriodEnd ?? null,
        ...(event.lastPaymentId ? { lastPaymentId: event.lastPaymentId } : {}),
      });
    } else {
      // halted, paused, pending, etc. — update status only, keep plan
      await upsertOrgSubscription(event.orgId, {
        status: event.status,
        providerSubscriptionId: event.subscriptionId,
      });
    }

    return { received: true };
  })
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
    async ({ body, orgId, set }) => {
      const { plan } = body;
      const provider = getDefaultProvider();

      const existing = await db.query.orgSubscriptions.findFirst({
        where: { orgId },
      });

      if (
        existing?.providerSubscriptionId &&
        ['active', 'authenticated', 'pending_cancellation'].includes(
          existing.status ?? '',
        )
      ) {
        set.status = 400;
        throw new Error(
          'Cancel your current subscription before subscribing to a new plan.',
        );
      }

      // Resume an incomplete checkout for the same plan rather than creating a duplicate
      if (
        existing?.status === 'created' &&
        existing.providerSubscriptionId &&
        existing.plan === plan
      ) {
        return {
          provider: provider.name,
          subscriptionId: existing.providerSubscriptionId,
          clientToken: provider.clientToken,
        };
      }

      // If a different plan was started but not paid, clean up the orphaned Razorpay subscription
      if (existing?.status === 'created' && existing.providerSubscriptionId) {
        try {
          await provider.cancelSubscription(existing.providerSubscriptionId, {
            atPeriodEnd: false,
          });
        } catch {
          // best-effort — subscription may already be cancelled on Razorpay's side
        }
      }

      const result = await provider.createSubscription({
        plan: plan as PaidPlanName,
        orgId,
      });

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
      response: { 200: 'CheckoutResponseSchema' },
    },
  )
  .post(
    '/cancel',
    async ({ body, orgId, set }) => {
      const { immediate } = body;
      const record = await db.query.orgSubscriptions.findFirst({
        where: { orgId },
      });

      if (
        !record?.providerSubscriptionId ||
        !['active', 'authenticated', 'halted', 'pending_cancellation'].includes(
          record.status ?? '',
        )
      ) {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');

      if (immediate) {
        await provider.cancelSubscription(record.providerSubscriptionId, {
          atPeriodEnd: false,
        });

        await upsertOrgSubscription(orgId, {
          plan: 'free',
          status: 'cancelled',
        });
      } else {
        await provider.cancelSubscription(record.providerSubscriptionId, {
          atPeriodEnd: true,
        });
        await upsertOrgSubscription(orgId, { status: 'pending_cancellation' });
      }

      return { success: true };
    },
    {
      body: 'CancelBodySchema',
      response: { 200: 'CancelResponseSchema' },
    },
  );
