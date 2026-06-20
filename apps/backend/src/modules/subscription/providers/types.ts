import type { PaidPlanName } from '../plans';
export type { PaidPlanName };

export interface CheckoutResult {
  subscriptionId: string;
  clientToken: string;
}

export interface WebhookEvent {
  orgId: string;
  plan?: string;
  status: string;
  subscriptionId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  lastPaymentId?: string;
  lastPaymentAmount?: number;
}

export interface SubscriptionState {
  subscriptionId: string;
  plan: PaidPlanName | 'free';
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

export interface PaymentProvider {
  readonly name: string;
  readonly clientToken: string;
  createSubscription(params: { plan: PaidPlanName; orgId: string; name?: string | null; email?: string | null }): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string, options?: { atPeriodEnd?: boolean }): Promise<void>;
  fetchSubscription(subscriptionId: string, orgId?: string): Promise<{
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }>;
  getSubscriptionPeriodEnd(subscriptionId: string, orgId?: string): Promise<Date | null>;
  issueRefund(paymentId: string, amount: number): Promise<void>;
  readonly signatureHeader?: string;
  parseWebhook?(rawBody: string, signature: string, headers?: Record<string, string>): WebhookEvent | null;
  /** Pull-based providers (e.g. Kelviq): fetch current subscription state live from the gateway. */
  getSubscription?(orgId: string): Promise<SubscriptionState | null>;
  /** Pull-based providers: evict cached subscription state, e.g. immediately after cancel. */
  invalidateSubscriptionCache?(orgId: string): void;
}
