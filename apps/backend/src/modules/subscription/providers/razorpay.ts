import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckoutResult, PaymentProvider, PaidPlanName, WebhookEvent } from './types';

export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay';
  readonly signatureHeader = 'x-razorpay-signature';

  private getClient(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private getPlanId(plan: PaidPlanName): string {
    const envKey = `RAZORPAY_PLAN_ID_${plan.toUpperCase()}` as
      | 'RAZORPAY_PLAN_ID_STARTER'
      | 'RAZORPAY_PLAN_ID_GROWTH'
      | 'RAZORPAY_PLAN_ID_PRO';
    const planId = process.env[envKey];
    if (!planId) throw new Error(`${envKey} env var is not set`);
    return planId;
  }

  private buildSubscriptionParams(plan: PaidPlanName, orgId: string, startAt?: Date) {
    return {
      plan_id: this.getPlanId(plan),
      total_count: 120,
      quantity: 1,
      ...(startAt ? { start_at: Math.floor(startAt.getTime() / 1000) } : {}),
      notes: { orgId, plan },
    };
  }

  async createSubscription({ plan, orgId }: { plan: PaidPlanName; orgId: string }): Promise<CheckoutResult> {
    const subscription = await this.getClient().subscriptions.create(
      this.buildSubscriptionParams(plan, orgId),
    );
    return { subscriptionId: subscription.id, clientToken: process.env.RAZORPAY_KEY_ID ?? '' };
  }

  async scheduleSubscription({ plan, orgId, startAt }: { plan: PaidPlanName; orgId: string; startAt: Date }): Promise<CheckoutResult> {
    const subscription = await this.getClient().subscriptions.create(
      this.buildSubscriptionParams(plan, orgId, startAt),
    );
    return { subscriptionId: subscription.id, clientToken: process.env.RAZORPAY_KEY_ID ?? '' };
  }

  async cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void> {
    await this.getClient().subscriptions.cancel(subscriptionId, options?.atPeriodEnd ?? false);
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    // Pass false to cancel_at_cycle_end to un-schedule the pending cancellation
    await this.getClient().subscriptions.cancel(subscriptionId, false);
  }

  async getSubscriptionPeriodEnd(subscriptionId: string): Promise<Date | null> {
    const sub = await this.getClient().subscriptions.fetch(subscriptionId);
    return (sub as any).current_end ? new Date((sub as any).current_end * 1000) : null;
  }

  parseWebhook(rawBody: string, signature: string): WebhookEvent | null {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET must be set');

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new Error('Invalid signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error('Invalid JSON');
    }

    const event = payload.event as string;
    const entity = payload?.payload?.subscription?.entity;
    if (!entity) return null;

    const orgId: string = entity.notes?.orgId;
    if (!orgId) return null;

    const planName: string = entity.notes?.plan;
    const subscriptionId: string = entity.id;
    const currentPeriodEnd = entity.current_end
      ? new Date(entity.current_end * 1000)
      : undefined;

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged':
        return { orgId, plan: planName ?? 'free', status: 'active', subscriptionId, currentPeriodEnd };
      case 'subscription.cancelled':
        return { orgId, plan: 'free', status: 'cancelled', subscriptionId, currentPeriodEnd };
      case 'subscription.completed':
        return { orgId, plan: 'free', status: 'completed', subscriptionId, currentPeriodEnd };
      case 'subscription.halted':
        return { orgId, status: 'halted', subscriptionId };
      case 'subscription.paused':
        return { orgId, status: 'paused', subscriptionId };
      default:
        return null;
    }
  }
}
