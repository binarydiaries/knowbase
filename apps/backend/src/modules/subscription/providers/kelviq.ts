import { InvalidRequestError, Kelviq } from '@kelviq/node-sdk';
import type {
  CheckoutResult,
  PaidPlanName,
  PaymentProvider,
  SyncResult,
} from './types';

const TERMINAL = new Set(['cancelled', 'expired', 'completed']);

interface CacheEntry {
  result: SyncResult | null;
  expiresAt: number;
}

export class KelviqProvider implements PaymentProvider {
  readonly name = 'kelviq';
  private _client: Kelviq | null = null;
  private readonly _cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL_MS = 60_000;

  private get client(): Kelviq {
    if (!this._client) {
      const accessToken = process.env.KELVIQ_SERVER_API_KEY;
      if (!accessToken) throw new Error('KELVIQ_SERVER_API_KEY must be set');
      const environment = process.env.ENV_KEY === 'production' ? 'production' : 'sandbox';
      this._client = new Kelviq({ accessToken, environment });
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

  // Reads env vars at call time so the map stays accurate if vars are set after module import
  private planNameFromIdentifier(identifier: string): PaidPlanName | undefined {
    const pairs: Array<[string | undefined, PaidPlanName]> = [
      [process.env.KELVIQ_PLAN_STARTER, 'starter'],
      [process.env.KELVIQ_PLAN_GROWTH, 'growth'],
      [process.env.KELVIQ_PLAN_PRO, 'pro'],
    ];
    return pairs.find(([id]) => id === identifier)?.[1];
  }

  private async ensureCustomer(orgId: string, name?: string | null, email?: string | null): Promise<void> {
    try {
      await this.client.customers.create({ customerId: orgId, name, email });
    } catch (err) {
      if (err instanceof InvalidRequestError) return; // customer already exists
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
      cancellationType: options?.atPeriodEnd ? 'CURRENT_PERIOD_ENDS' : 'IMMEDIATE',
    });
  }

  invalidateCachedState(orgId: string): void {
    this._cache.delete(orgId);
  }

  async fetchSubscription(
    _subscriptionId: string,
    orgId?: string,
  ): Promise<{
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }> {
    if (!orgId) throw new Error('orgId is required to fetch a Kelviq subscription');
    const result = await this.syncSubscription(orgId);
    if (!result) throw new Error(`No active subscription found for org ${orgId}`);
    return {
      status: result.status,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
    };
  }

  async getSubscriptionPeriodEnd(
    _subscriptionId: string,
    orgId?: string,
  ): Promise<Date | null> {
    if (!orgId) return null;
    const result = await this.syncSubscription(orgId);
    return result?.currentPeriodEnd ?? null;
  }

  async issueRefund(_paymentId: string, _amount: number): Promise<void> {
    throw new Error(
      'Kelviq does not expose a refund API. Issue refunds via the Kelviq dashboard.',
    );
  }

  async syncSubscription(orgId: string): Promise<SyncResult | null> {
    const cached = this._cache.get(orgId);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const data = await this.client._request<{ results: any[] }>(
      'GET',
      '/subscriptions/',
      undefined,
      { customerId: orgId, pageSize: 50 },
    );

    const results: any[] = data.results ?? [];

    // Prefer non-terminal subscription; fall back to most recent
    const raw = results.find((s) => !TERMINAL.has((s.status ?? '').toLowerCase())) ?? results[0];

    let result: SyncResult | null = null;

    if (raw) {
      const status = ((raw.status as string) ?? 'unknown').toLowerCase();
      const isTerminal = TERMINAL.has(status);

      // When cancelled with CURRENT_PERIOD_ENDS, Kelviq keeps status ACTIVE
      // but sets endDate to the scheduled cancellation date.
      const isPendingCancellation =
        !isTerminal &&
        (status === 'active' || status === 'authenticated') &&
        raw.endDate != null &&
        new Date(raw.endDate) > new Date();

      const effectiveStatus = isPendingCancellation ? 'pending_cancellation' : status;
      const planIdentifier: string = raw.plan?.identifier ?? raw.planIdentifier ?? '';
      const planName = this.planNameFromIdentifier(planIdentifier);
      const periodEnd = isPendingCancellation ? raw.endDate : raw.billingPeriodEndTime;

      result = {
        subscriptionId: raw.id as string,
        plan: isTerminal || !planName ? 'free' : planName,
        status: effectiveStatus,
        currentPeriodStart: raw.billingPeriodStartTime
          ? new Date(raw.billingPeriodStartTime)
          : null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      };
    }

    this._cache.set(orgId, { result, expiresAt: Date.now() + KelviqProvider.CACHE_TTL_MS });
    return result;
  }
}
