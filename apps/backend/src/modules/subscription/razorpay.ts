import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getRazorpayPlanId(plan: 'starter' | 'growth' | 'pro'): string {
  const envKey = `RAZORPAY_PLAN_ID_${plan.toUpperCase()}` as
    | 'RAZORPAY_PLAN_ID_STARTER'
    | 'RAZORPAY_PLAN_ID_GROWTH'
    | 'RAZORPAY_PLAN_ID_PRO';
  const planId = process.env[envKey];
  if (!planId) {
    throw new Error(`${envKey} env var is not set`);
  }
  return planId;
}

export async function createRazorpaySubscription({
  planId,
  orgId,
  planName,
}: {
  planId: string;
  orgId: string;
  planName: string;
}) {
  const client = getRazorpayClient();
  const subscription = await client.subscriptions.create({
    plan_id: planId,
    total_count: 120, // 10 years max; Razorpay requires a finite count
    quantity: 1,
    notes: { orgId, plan: planName },
  });
  return subscription;
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
  const client = getRazorpayClient();
  return client.subscriptions.cancel(subscriptionId);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET must be set');
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
