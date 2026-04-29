export type PaidPlanName = 'starter' | 'growth' | 'pro';

export interface CheckoutResult {
  subscriptionId: string;
  clientToken: string;
}

export interface WebhookEvent {
  orgId: string;
  plan?: string; // undefined = don't update plan in DB
  status: string;
  subscriptionId: string;
  currentPeriodEnd?: Date;
}

export interface PaymentProvider {
  readonly name: string;
  readonly signatureHeader: string;
  createSubscription(params: { plan: PaidPlanName; orgId: string }): Promise<CheckoutResult>;
  /** Create a subscription that starts billing on a future date (for plan changes at period end). */
  scheduleSubscription(params: { plan: PaidPlanName; orgId: string; startAt: Date }): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void>;
  /** Undo a pending-cancellation (cancel_at_cycle_end) before the period ends. */
  resumeSubscription(subscriptionId: string): Promise<void>;
  /** Fetch the current period end date for an existing subscription. */
  getSubscriptionPeriodEnd(subscriptionId: string): Promise<Date | null>;
  /** Throws on invalid signature. Returns null for unknown/ignored events. */
  parseWebhook(rawBody: string, signature: string): WebhookEvent | null;
}
