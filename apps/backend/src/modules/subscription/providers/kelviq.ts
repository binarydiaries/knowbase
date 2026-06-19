import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckoutResult, PaymentProvider, PaidPlanName, WebhookEvent } from './types';

const BASE_URL = 'https://api.kelviq.com/api/v1';

// Reverse map: kelviq plan identifier → internal plan name
// Built once at startup from env vars
const IDENTIFIER_TO_PLAN: Record<string, PaidPlanName> = {};

function buildPlanMap(): void {
  const pairs: Array<[string | undefined, PaidPlanName]> = [
    [process.env.KELVIQ_PLAN_STARTER, 'starter'],
    [process.env.KELVIQ_PLAN_GROWTH, 'growth'],
    [process.env.KELVIQ_PLAN_PRO, 'pro'],
  ];
  for (const [identifier, name] of pairs) {
    if (identifier) IDENTIFIER_TO_PLAN[identifier] = name;
  }
}

buildPlanMap();

export class KelviqProvider implements PaymentProvider {
  readonly name = 'kelviq';
  readonly signatureHeader = 'webhook-signature';

  get clientToken(): string {
    return process.env.KELVIQ_CLIENT_API_KEY ?? '';
  }

  private get serverKey(): string {
    const key = process.env.KELVIQ_SERVER_API_KEY;
    if (!key) throw new Error('KELVIQ_SERVER_API_KEY must be set');
    return key;
  }

  private getPlanIdentifier(plan: PaidPlanName): string {
    const envKey = `KELVIQ_PLAN_${plan.toUpperCase()}` as
      | 'KELVIQ_PLAN_STARTER'
      | 'KELVIQ_PLAN_GROWTH'
      | 'KELVIQ_PLAN_PRO';
    const identifier = process.env[envKey];
    if (!identifier) throw new Error(`${envKey} env var is not set`);
    return identifier;
  }

  private async request(method: string, path: string, body?: unknown): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.serverKey}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Kelviq API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  private async ensureCustomer(orgId: string): Promise<void> {
    try {
      await this.request('POST', '/customers/', { customerId: orgId });
    } catch (err: any) {
      // 400 = customer already exists — safe to proceed
      if (!err.message?.includes('400')) throw err;
    }
  }

  async createSubscription({ plan, orgId }: { plan: PaidPlanName; orgId: string }): Promise<CheckoutResult> {
    await this.ensureCustomer(orgId);

    const successUrl = `${process.env.APP_URL ?? ''}/subscriptions?success=true`;
    const data = await this.request('POST', '/checkout/sessions/', {
      planIdentifier: this.getPlanIdentifier(plan),
      chargePeriod: 'MONTHLY',
      customerId: orgId,
      successUrl,
    });

    return {
      subscriptionId: data.checkoutSessionId ?? data.id,
      clientToken: data.checkoutUrl ?? '',
    };
  }

  async cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void> {
    const cancellationType = options?.atPeriodEnd ? 'CURRENT_PERIOD_ENDS' : 'IMMEDIATE';
    await this.request('POST', `/subscriptions/${subscriptionId}/cancel/`, { cancellationType });
  }

  async fetchSubscription(subscriptionId: string, orgId?: string): Promise<{
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }> {
    if (!orgId) throw new Error('orgId is required to fetch a Kelviq subscription');
    const data = await this.request('GET', `/subscriptions/?customer_id=${encodeURIComponent(orgId)}&page_size=50`);
    const sub = (data.results ?? []).find((s: any) => s.id === subscriptionId);
    if (!sub) throw new Error(`Kelviq subscription ${subscriptionId} not found for org ${orgId}`);
    return {
      status: sub.status as string,
      currentPeriodStart: sub.billingPeriodStartTime ? new Date(sub.billingPeriodStartTime) : null,
      currentPeriodEnd: sub.billingPeriodEndTime ? new Date(sub.billingPeriodEndTime) : null,
    };
  }

  async getSubscriptionPeriodEnd(subscriptionId: string, orgId?: string): Promise<Date | null> {
    const sub = await this.fetchSubscription(subscriptionId, orgId);
    return sub.currentPeriodEnd;
  }

  async issueRefund(_paymentId: string, _amount: number): Promise<void> {
    throw new Error('Kelviq does not expose a refund API. Issue refunds via the Kelviq dashboard.');
  }

  parseWebhook(rawBody: string, signature: string, headers?: Record<string, string>): WebhookEvent | null {
    const secret = process.env.KELVIQ_WEBHOOK_SECRET;
    if (!secret) throw new Error('KELVIQ_WEBHOOK_SECRET must be set');

    const webhookId = headers?.['webhook-id'] ?? '';
    const webhookTimestamp = headers?.['webhook-timestamp'] ?? '';
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

    const expected = createHmac('sha256', secret).update(signedContent).digest('hex');
    // Kelviq prefixes the signature with "v1,"
    const actualHex = signature.startsWith('v1,') ? signature.slice(3) : signature;

    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(actualHex, 'hex');
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new Error('Invalid Kelviq webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error('Invalid JSON in webhook body');
    }

    const event = payload.type as string;
    const obj = payload?.data?.object;
    if (!obj) return null;

    // customerId is set to orgId at subscription creation
    const orgId: string = obj.customerId;
    if (!orgId) return null;

    const subscriptionId: string = obj.subscriptionId ?? obj.id;
    const planIdentifier: string = obj.plan?.identifier ?? obj.planIdentifier ?? '';
    const planName = IDENTIFIER_TO_PLAN[planIdentifier];
    const currentPeriodStart = obj.billingPeriodStartTime ? new Date(obj.billingPeriodStartTime) : undefined;
    const currentPeriodEnd = obj.billingPeriodEndTime ? new Date(obj.billingPeriodEndTime) : undefined;

    switch (event) {
      case 'subscription.created':
      case 'invoice.paid':
        return {
          orgId,
          plan: planName,
          status: 'active',
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          lastPaymentId: obj.orderId ?? obj.invoiceId,
          lastPaymentAmount: obj.amount !== undefined ? Number(obj.amount) : undefined,
        };
      case 'checkout.completed':
        return {
          orgId,
          plan: planName,
          status: 'active',
          subscriptionId: obj.subscriptionId ?? subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        };
      case 'subscription.cancelled':
        return { orgId, plan: 'free', status: 'cancelled', subscriptionId, currentPeriodEnd };
      case 'subscription.plan_changed':
        return { orgId, plan: planName, status: 'active', subscriptionId, currentPeriodStart, currentPeriodEnd };
      case 'subscription.updated':
        return { orgId, status: 'active', subscriptionId, currentPeriodStart, currentPeriodEnd };
      default:
        return null;
    }
  }
}
