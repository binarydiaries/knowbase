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

  private async ensureCustomer(orgId: string, name?: string | null, email?: string | null): Promise<void> {
    try {
      await this.client.customers.create({ customerId: orgId, name, email });
    } catch (err) {
      if (err instanceof InvalidRequestError) return;
      throw err;
    }
  }

  async createSubscription({
    plan,
    orgId,
    name,
    email,
  }: {
    plan: PaidPlanName;
    orgId: string;
    name?: string | null;
    email?: string | null;
  }): Promise<CheckoutResult> {
    await this.ensureCustomer(orgId, name, email);

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
    const TERMINAL = new Set(['cancelled', 'CANCELLED', 'expired', 'EXPIRED', 'completed', 'COMPLETED']);
    const ACTIVE_STATUSES = new Set(['active', 'ACTIVE', 'authenticated', 'AUTHENTICATED']);

    // Prefer non-terminal subscriptions; fall back to most recent
    const sub =
      results.find((s) => !TERMINAL.has(s.status ?? '')) ??
      results[0];

    if (!sub) return null;

    const planIdentifier: string = sub.plan?.identifier ?? sub.planIdentifier ?? '';
    const planName = IDENTIFIER_TO_PLAN[planIdentifier];
    const isTerminal = TERMINAL.has(sub.status ?? '');

    // When cancelled with CURRENT_PERIOD_ENDS, Kelviq keeps status ACTIVE
    // but sets endDate to the scheduled cancellation date.
    const isPendingCancellation =
      !isTerminal &&
      ACTIVE_STATUSES.has(sub.status ?? '') &&
      sub.endDate != null &&
      new Date(sub.endDate) > new Date();

    const effectiveStatus = isTerminal
      ? (sub.status as string).toLowerCase()
      : isPendingCancellation
        ? 'pending_cancellation'
        : (sub.status as string ?? 'unknown').toLowerCase();

    // currentPeriodEnd: use endDate when pending cancellation (it's the actual last day)
    const periodEnd = isPendingCancellation
      ? sub.endDate
      : sub.billingPeriodEndTime;

    return {
      subscriptionId: sub.id as string,
      plan: isTerminal || !planName ? 'free' : planName,
      status: effectiveStatus,
      currentPeriodStart: sub.billingPeriodStartTime
        ? new Date(sub.billingPeriodStartTime)
        : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
    };
  }
}
