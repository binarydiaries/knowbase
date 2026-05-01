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

export interface PaymentProvider {
  readonly name: string;
  readonly signatureHeader: string;
  createSubscription(params: { plan: PaidPlanName; orgId: string }): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void>;
  /** Fetch the current period end date for an existing subscription. */
  getSubscriptionPeriodEnd(subscriptionId: string): Promise<Date | null>;
  /** Issue a partial refund for a Razorpay payment. Amount in paise. */
  issueRefund(paymentId: string, amountPaise: number): Promise<void>;
  /** Throws on invalid signature. Returns null for unknown/ignored events. */
  parseWebhook(rawBody: string, signature: string): WebhookEvent | null;
}
