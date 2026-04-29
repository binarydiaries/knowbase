import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';
import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
  getRazorpayPlanId,
  verifyRazorpayWebhook,
} from './razorpay';

type OrgSubscriptionUpdate = {
  plan?: string;
  status: string;
  razorpaySubscriptionId?: string;
  currentPeriodEnd?: Date | null;
};

async function upsertOrgSubscription(orgId: string, data: OrgSubscriptionUpdate) {
  await db
    .insert(orgSubscriptions)
    .values({ orgId, ...data })
    .onConflictDoUpdate({
      target: orgSubscriptions.orgId,
      set: { ...data, updatedAt: new Date() },
    });
}

export const Subscription = new Elysia({
  prefix: '/subscriptions',
  tags: ['Subscription'],
})
  .use(SubscriptionModel)
  // PUBLIC — no auth, Razorpay calls this directly
  .post(
    '/webhook',
    async ({ request, set }) => {
      const rawBody = await request.text();
      const signature = request.headers.get('x-razorpay-signature') ?? '';

      if (!verifyRazorpayWebhook(rawBody, signature)) {
        set.status = 400;
        return { error: 'Invalid signature' };
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        set.status = 400;
        return { error: 'Invalid JSON' };
      }

      const event = payload.event as string;
      const subscription = (payload as any)?.payload?.subscription?.entity;
      if (!subscription) return { received: true };

      const orgId: string = subscription.notes?.orgId;
      const planName: string = subscription.notes?.plan;
      const razorpaySubscriptionId: string = subscription.id;

      if (!orgId) return { received: true };

      const currentPeriodEnd = subscription.current_end
        ? new Date(subscription.current_end * 1000)
        : null;

      switch (event) {
        case 'subscription.activated':
        case 'subscription.charged':
          await upsertOrgSubscription(orgId, {
            plan: planName ?? 'free',
            status: 'active',
            razorpaySubscriptionId,
            currentPeriodEnd,
          });
          break;

        case 'subscription.cancelled':
        case 'subscription.completed':
          await upsertOrgSubscription(orgId, {
            plan: 'free',
            status: event === 'subscription.cancelled' ? 'cancelled' : 'completed',
            currentPeriodEnd,
          });
          break;

        case 'subscription.halted':
          await upsertOrgSubscription(orgId, {
            status: 'halted',
            razorpaySubscriptionId,
          });
          break;

        case 'subscription.paused':
          await upsertOrgSubscription(orgId, {
            status: 'paused',
            razorpaySubscriptionId,
          });
          break;
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

      let planId: string;
      try {
        planId = getRazorpayPlanId(plan);
      } catch {
        set.status = 503;
        return { error: `Razorpay plan ID for ${plan} is not configured` };
      }

      const subscription = await createRazorpaySubscription({
        planId,
        orgId,
        planName: plan,
      });

      await upsertOrgSubscription(orgId, {
        plan,
        status: subscription.status as string,
        razorpaySubscriptionId: subscription.id,
      });

      return {
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID ?? '',
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
        where: eq(orgSubscriptions.orgId, orgId),
      });

      if (!record?.razorpaySubscriptionId) {
        set.status = 404;
        return { success: false };
      }

      await cancelRazorpaySubscription(record.razorpaySubscriptionId);

      await upsertOrgSubscription(orgId, {
        plan: 'free',
        status: 'cancelled',
      });

      return { success: true };
    },
    {
      response: {
        200: 'CancelResponseSchema',
      },
    },
  );
