import { Elysia } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';
import { getDefaultProvider, getProvider } from './providers';
import { PLANS, PLAN_ORDER, type PlanName, type PaidPlanName } from './plans';

type OrgSubscriptionUpdate = {
  plan?: string;
  status?: string;
  provider?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  lastPaymentId?: string | null;
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
  // PUBLIC — no auth required
  .get(
    '/plans',
    () => ({
      plans: PLAN_ORDER.map((slug) => PLANS[slug]),
    }),
    { response: { 200: 'PlansResponseSchema' } },
  )
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
    async ({ body, orgId, set }) => {
      const { plan } = body;
      const provider = getDefaultProvider();

      const existing = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (
        existing?.providerSubscriptionId &&
        ['active', 'authenticated', 'pending_cancellation'].includes(existing.status ?? '')
      ) {
        set.status = 400;
        throw new Error('Cancel your current subscription before subscribing to a new plan.');
      }

      const result = await provider.createSubscription({ plan: plan as PaidPlanName, orgId });

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
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (
        !record?.providerSubscriptionId ||
        !['active', 'authenticated', 'pending_cancellation'].includes(record.status ?? '')
      ) {
        set.status = 404;
        return { success: false };
      }

      const provider = getProvider(record.provider ?? 'razorpay');

      if (immediate) {
        await provider.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: false });

        if (record.lastPaymentId && record.currentPeriodStart && record.currentPeriodEnd) {
          const now = new Date();
          const periodStart = record.currentPeriodStart;
          const periodEnd = record.currentPeriodEnd;

          // If current period hasn't expired, issue a prorated refund
          if (now < periodEnd) {
            const msUsed = now.getTime() - periodStart.getTime();
            const msPeriod = periodEnd.getTime() - periodStart.getTime();
            const usedRatio = Math.min(1, Math.max(0, msUsed / msPeriod));
            const planAmount = PLANS[record.plan as PlanName]?.priceMonthlyPaise ?? 0;
            const chargeForUsed = Math.floor(planAmount * usedRatio);
            const refundPaise = planAmount - chargeForUsed;
            if (refundPaise >= 100) {
              await provider.issueRefund(record.lastPaymentId, refundPaise);
            }
          }
          // If period is already over → no refund
        }

        await upsertOrgSubscription(orgId, { plan: 'free', status: 'cancelled' });
      } else {
        await provider.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: true });
        await upsertOrgSubscription(orgId, { status: 'pending_cancellation' });
      }

      return { success: true };
    },
    {
      body: 'CancelBodySchema',
      response: { 200: 'CancelResponseSchema' },
    },
  );
