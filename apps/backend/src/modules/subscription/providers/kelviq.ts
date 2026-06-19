import {
  InvalidRequestError,
  Kelviq,
  validateEvent,
  WebhookVerificationError,
} from '@kelviq/node-sdk';
import type {
  CheckoutResult,
  PaidPlanName,
  PaymentProvider,
  WebhookEvent,
} from './types';

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

  private _client: Kelviq | null = null;

  private get client(): Kelviq {
    if (!this._client) {
      const accessToken = process.env.KELVIQ_SERVER_API_KEY;
      if (!accessToken) throw new Error('KELVIQ_SERVER_API_KEY must be set');
      this._client = new Kelviq({ accessToken, environment: 'sandbox' });
    }
    return this._client;
  }

  get clientToken(): string {
    return process.env.KELVIQ_CLIENT_API_KEY ?? '';
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

  private async ensureCustomer(orgId: string): Promise<void> {
    try {
      await this.client.customers.create({ customerId: orgId });
    } catch (err) {
      if (err instanceof InvalidRequestError) return;
      throw err;
    }
  }

  async createSubscription({
    plan,
    orgId,
  }: {
    plan: PaidPlanName;
    orgId: string;
  }): Promise<CheckoutResult> {
    await this.ensureCustomer(orgId);

    const successUrl = `${process.env.APP_URL ?? ''}/subscriptions?success=true`;
    const data = await this.client.checkout.createSession({
      planIdentifier: this.getPlanIdentifier(plan),
      chargePeriod: 'MONTHLY',
      customerId: orgId,
      successUrl,
    });

    return {
      subscriptionId: data.checkoutSessionId,
      clientToken: data.checkoutUrl,
    };
  }

  async cancelSubscription(
    subscriptionId: string,
    options?: { atPeriodEnd?: boolean },
  ): Promise<void> {
    await this.client.subscriptions.cancel({
      subscriptionId,
      cancellationType: options?.atPeriodEnd
        ? 'CURRENT_PERIOD_ENDS'
        : 'IMMEDIATE',
    });
  }

  async fetchSubscription(
    subscriptionId: string,
    orgId?: string,
  ): Promise<{
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }> {
    if (!orgId)
      throw new Error('orgId is required to fetch a Kelviq subscription');
    const data = await this.client._request<{ results: any[] }>(
      'GET',
      '/subscriptions/',
      undefined,
      { customerId: orgId, pageSize: 50 },
    );
    const sub = data.results?.find((s: any) => s.id === subscriptionId);
    if (!sub)
      throw new Error(
        `Kelviq subscription ${subscriptionId} not found for org ${orgId}`,
      );
    return {
      status: sub.status as string,
      currentPeriodStart: sub.billingPeriodStartTime
        ? new Date(sub.billingPeriodStartTime)
        : null,
      currentPeriodEnd: sub.billingPeriodEndTime
        ? new Date(sub.billingPeriodEndTime)
        : null,
    };
  }

  async getSubscriptionPeriodEnd(
    subscriptionId: string,
    orgId?: string,
  ): Promise<Date | null> {
    const sub = await this.fetchSubscription(subscriptionId, orgId);
    return sub.currentPeriodEnd;
  }

  async issueRefund(_paymentId: string, _amount: number): Promise<void> {
    throw new Error(
      'Kelviq does not expose a refund API. Issue refunds via the Kelviq dashboard.',
    );
  }

  parseWebhook(
    rawBody: string,
    signature: string,
    headers?: Record<string, string>,
  ): WebhookEvent | null {
    const secret = process.env.KELVIQ_WEBHOOK_SECRET;
    if (!secret) throw new Error('KELVIQ_WEBHOOK_SECRET must be set');

    let payload: Record<string, unknown>;
    try {
      payload = validateEvent(
        rawBody,
        { ...headers, 'webhook-signature': signature },
        secret,
      ) as Record<string, unknown>;
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        throw new Error('Invalid Kelviq webhook signature');
      }
      throw err;
    }

    const event = payload.type as string;
    const obj = (payload as any)?.data?.object;
    if (!obj) return null;

    const orgId: string = obj.customerId;
    if (!orgId) return null;

    const subscriptionId: string = obj.subscriptionId ?? obj.id;
    const planIdentifier: string =
      obj.plan?.identifier ?? obj.planIdentifier ?? '';
    const planName = IDENTIFIER_TO_PLAN[planIdentifier];
    const currentPeriodStart = obj.billingPeriodStartTime
      ? new Date(obj.billingPeriodStartTime)
      : undefined;
    const currentPeriodEnd = obj.billingPeriodEndTime
      ? new Date(obj.billingPeriodEndTime)
      : undefined;

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
          lastPaymentAmount:
            obj.amount !== undefined ? Number(obj.amount) : undefined,
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
        return {
          orgId,
          plan: 'free',
          status: 'cancelled',
          subscriptionId,
          currentPeriodEnd,
        };
      case 'subscription.plan_changed':
        return {
          orgId,
          plan: planName,
          status: 'active',
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        };
      case 'subscription.updated':
        return {
          orgId,
          status: 'active',
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        };
      default:
        return null;
    }
  }
}
