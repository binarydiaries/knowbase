import type { PaidPlanName } from '../plans';
export type { PaidPlanName };

export interface CheckoutResult {
  subscriptionId: string;
  clientToken: string;
}

export interface WebhookEvent {
  orgId: string;
  plan?: string; // undefined = don't update plan in DB
  status: string;
  subscriptionId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  lastPaymentId?: string;
  lastPaymentAmount?: number;
}

export interface SyncResult {
  subscriptionId: string;
  plan: PaidPlanName | 'free';
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

export interface PaymentProvider {
  readonly name: string;
  readonly clientToken: string;
  createSubscription(params: { plan: PaidPlanName; orgId: string }): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void>;
  /** Fetch live subscription details from the payment gateway. orgId required by some providers. */
  fetchSubscription(subscriptionId: string, orgId?: string): Promise<{
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }>;
  /** Fetch the current period end date for an existing subscription. orgId required by some providers. */
  getSubscriptionPeriodEnd(subscriptionId: string, orgId?: string): Promise<Date | null>;
  /** Issue a partial refund for a payment. Amount in smallest currency unit. */
  issueRefund(paymentId: string, amount: number): Promise<void>;
  /** Webhook-based providers: verify signature and parse event. */
  readonly signatureHeader?: string;
  parseWebhook?(rawBody: string, signature: string, headers?: Record<string, string>): WebhookEvent | null;
  /** Pull-based providers: fetch the current subscription state directly from the gateway. */
  syncSubscription?(orgId: string): Promise<SyncResult | null>;
}
