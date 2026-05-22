import { RazorpayProvider } from './razorpay';
import type { PaymentProvider } from './types';

const PROVIDERS: Record<string, PaymentProvider> = {
  razorpay: new RazorpayProvider(),
};

export function getProvider(name: string): PaymentProvider {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown payment provider: ${name}`);
  return provider;
}

export function getDefaultProvider(): PaymentProvider {
  return getProvider(process.env.PAYMENT_PROVIDER ?? 'razorpay');
}

export type {
  CheckoutResult,
  PaidPlanName,
  PaymentProvider,
  WebhookEvent,
} from './types';
