import { InvalidRequestError, Kelviq } from '@kelviq/node-sdk';
import type {
  CheckoutResult,
  PaidPlanName,
  PaymentProvider,
  SyncResult,
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

  async syncSubscription(orgId: string): Promise<SyncResult | null> {
    const data = await this.client._request<{ results: any[] }>(
      'GET',
      '/subscriptions/',
      undefined,
      { customerId: orgId, pageSize: 50 },
    );

    const results: any[] = data.results ?? [];
    const ACTIVE_STATUSES = ['active', 'ACTIVE', 'authenticated', 'pending_cancellation'];
    const sub =
      results.find((s) => ACTIVE_STATUSES.includes(s.status ?? '')) ??
      results[0];

    if (!sub) return null;

    const planIdentifier: string = sub.plan?.identifier ?? sub.planIdentifier ?? '';
    const planName = IDENTIFIER_TO_PLAN[planIdentifier];
    const isTerminal = ['cancelled', 'CANCELLED', 'expired', 'EXPIRED', 'completed'].includes(
      sub.status ?? '',
    );

    return {
      subscriptionId: sub.id as string,
      plan: isTerminal || !planName ? 'free' : planName,
      status: (sub.status as string ?? 'unknown').toLowerCase(),
      currentPeriodStart: sub.billingPeriodStartTime
        ? new Date(sub.billingPeriodStartTime)
        : null,
      currentPeriodEnd: sub.billingPeriodEndTime
        ? new Date(sub.billingPeriodEndTime)
        : null,
    };
  }
}
