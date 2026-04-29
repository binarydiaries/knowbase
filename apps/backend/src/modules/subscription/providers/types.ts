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
  cancelSubscription(subscriptionId: string): Promise<void>;
  /** Throws on invalid signature. Returns null for unknown/ignored events. */
  parseWebhook(rawBody: string, signature: string): WebhookEvent | null;
}
