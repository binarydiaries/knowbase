import { Elysia } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';
import { getDefaultProvider, getProvider } from './providers';
import { PLANS, PLAN_ORDER, type PlanName, type PaidPlanName } from './plans';
import { OrgUsageDailyService, OrgUsageMonthlyService } from './usage';

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

        if (record.lastPaymentId && record.currentPeriodEnd) {
          const now = new Date();
          // Only refund if the billing period hasn't expired yet
          if (now < record.currentPeriodEnd) {
            const planData = PLANS[record.plan as PlanName];
            const freePlan = PLANS['free'];
            if (planData && planData.priceMonthlyPaise > 0) {
              const periodStartKey = record.currentPeriodStart
                ? record.currentPeriodStart.toISOString().slice(0, 10)
                : now.toISOString().slice(0, 10);

              const msPerDay = 24 * 60 * 60 * 1000;
              const startDate = new Date(periodStartKey + 'T00:00:00Z');
              const todayDate = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
              const daysElapsed = Math.floor((todayDate.getTime() - startDate.getTime()) / msPerDay) + 1;

              const [messagesThisMonth, totalTrainingRuns] = await Promise.all([
                OrgUsageMonthlyService.getCurrentMonthAssistantMessages(orgId),
                OrgUsageDailyService.getTotalTrainingRunsSince(orgId, periodStartKey),
              ]);

              // Messages: paid capacity = plan limit minus free tier
              const paidMessageCapacity = planData.limits.messagesPerMonth - freePlan.limits.messagesPerMonth;
              const paidMessagesUsed = Math.max(0, messagesThisMonth - freePlan.limits.messagesPerMonth);
              const messageUsedRatio = Math.min(1, paidMessagesUsed / Math.max(1, paidMessageCapacity));

              // Training: aggregate across all days from period start; free allowance accrues per day
              const totalFreeTraining = daysElapsed * freePlan.limits.trainingRunsPerDay;
              const totalPaidTrainingCapacity = daysElapsed * (planData.limits.trainingRunsPerDay - freePlan.limits.trainingRunsPerDay);
              const paidTrainingUsed = Math.max(0, totalTrainingRuns - totalFreeTraining);
              const trainingUsedRatio = Math.min(1, paidTrainingUsed / Math.max(1, totalPaidTrainingCapacity));

              const combinedUsedRatio = (messageUsedRatio + trainingUsedRatio) / 2;
              const refundPaise = Math.floor(planData.priceMonthlyPaise * (1 - combinedUsedRatio));
              if (refundPaise >= 100) {
                await provider.issueRefund(record.lastPaymentId, refundPaise);
              }
            }
          }
          // Period already expired → no refund
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
