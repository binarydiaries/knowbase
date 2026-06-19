import { Elysia } from 'elysia';
import { clerkClient } from 'elysia-clerk';
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

const ACTIVE_STATUSES = new Set(['active', 'authenticated', 'pending_cancellation']);

// Used only by the Razorpay path
async function upsertOrgSubscription(
  orgId: string,
  data: {
    plan?: string;
    status?: string;
    provider?: string;
    providerSubscriptionId?: string;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    lastPaymentId?: string | null;
  },
) {
  const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await db
    .insert(orgSubscriptions)
    .values({ orgId, ...data })
    .onConflictDoUpdate({ target: orgSubscriptions.orgId, set: { ...defined, updatedAt: new Date() } });
}

export const Subscription = new Elysia({
  prefix: '/subscriptions',
  tags: ['Subscription'],
})
  .use(SubscriptionModel)
  // PUBLIC — no auth required
  .get(
    '/plans',
    () => ({ plans: PLAN_ORDER.map((slug) => PLANS[slug]) }),
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

    if (!provider.parseWebhook || !provider.signatureHeader) {
      set.status = 400;
      return { error: 'This provider does not support webhooks' };
    }

    const rawBody = await request.text();
    const signature = request.headers.get(provider.signatureHeader) ?? '';
    const extraHeaders: Record<string, string> = {};
    for (const key of ['webhook-id', 'webhook-timestamp']) {
      const val = request.headers.get(key);
      if (val) extraHeaders[key] = val;
    }

    let event: WebhookEvent | null;
    try {
      event = provider.parseWebhook(rawBody, signature, extraHeaders);
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
    async ({ orgId }) => SubscriptionService.getStatus(orgId),
    { response: 'SubscriptionStatusSchema' },
  )
  .post(
    '/checkout',
    async ({ body, orgId, userId, set }) => {
      const { plan } = body;
      const provider = getDefaultProvider();

      if (provider.syncSubscription) {
        // Kelviq: check live subscription state — no local DB
        const existing = await provider.syncSubscription(orgId);
        if (existing && ACTIVE_STATUSES.has(existing.status)) {
          set.status = 400;
          throw new Error('Cancel your current subscription before subscribing to a new plan.');
        }

        let name: string | null = null;
        let email: string | null = null;
        try {
          const [org, user] = await Promise.all([
            clerkClient.organizations.getOrganization({ organizationId: orgId }),
            clerkClient.users.getUser(userId),
          ]);
          name = org.name ?? null;
          email = user.primaryEmailAddress?.emailAddress ?? null;
        } catch {
          // best-effort — proceed without name/email
        }

        const result = await provider.createSubscription({ plan: plan as PaidPlanName, orgId, name, email });
        return { provider: provider.name, subscriptionId: result.subscriptionId, clientToken: result.clientToken };
      }

      // Razorpay: use local DB
      const existing = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (existing?.providerSubscriptionId && ACTIVE_STATUSES.has(existing.status ?? '')) {
        set.status = 400;
        throw new Error('Cancel your current subscription before subscribing to a new plan.');
      }

      // Resume an incomplete checkout to avoid duplicate subscriptions
      if (existing?.status === 'created' && existing.providerSubscriptionId && existing.plan === plan) {
        return { provider: provider.name, subscriptionId: existing.providerSubscriptionId, clientToken: provider.clientToken };
      }

      // Clean up orphaned subscription if plan changed mid-checkout
      if (existing?.status === 'created' && existing.providerSubscriptionId) {
        try {
          await provider.cancelSubscription(existing.providerSubscriptionId, { atPeriodEnd: false });
        } catch {
          // best-effort
        }
      }

      const result = await provider.createSubscription({ plan: plan as PaidPlanName, orgId });

      await upsertOrgSubscription(orgId, {
        plan,
        status: 'created',
        provider: provider.name,
        providerSubscriptionId: result.subscriptionId,
      });

      return { provider: provider.name, subscriptionId: result.subscriptionId, clientToken: result.clientToken };
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
      const provider = getDefaultProvider();

      if (provider.syncSubscription) {
        // Kelviq: find active subscription live
        const sub = await provider.syncSubscription(orgId);
        if (!sub || !ACTIVE_STATUSES.has(sub.status)) {
          set.status = 404;
          return { success: false };
        }
        await provider.cancelSubscription(sub.subscriptionId, { atPeriodEnd: !immediate });
        return { success: true };
      }

      // Razorpay: use local DB
      const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });

      if (!record?.providerSubscriptionId || !['active', 'authenticated', 'halted', 'pending_cancellation'].includes(record.status ?? '')) {
        set.status = 404;
        return { success: false };
      }

      const razorpay = getProvider(record.provider ?? 'razorpay');

      if (immediate) {
        await razorpay.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: false });
        await upsertOrgSubscription(orgId, { plan: 'free', status: 'cancelled' });
      } else {
        await razorpay.cancelSubscription(record.providerSubscriptionId, { atPeriodEnd: true });
        await upsertOrgSubscription(orgId, { status: 'pending_cancellation' });
      }

      return { success: true };
    },
    {
      body: 'CancelBodySchema',
      response: { 200: 'CancelResponseSchema' },
    },
  );
