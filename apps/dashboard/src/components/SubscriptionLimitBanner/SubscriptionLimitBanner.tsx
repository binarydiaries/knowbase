import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { AlertTriangle } from 'lucide-react';

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'growth' | 'pro';
  activeChatbotLimit: number;
  activeChatbotCount: number;
  isOverLimit: boolean;
};

export function SubscriptionLimitBanner({
  subscription,
}: {
  subscription?: SubscriptionStatus;
}) {
  if (!subscription?.isOverLimit) {
    return null;
  }

  return (
    <Alert>
      <AlertTriangle />
      <AlertTitle>Chatbot editing is locked</AlertTitle>
      <AlertDescription>
        Your {subscription.plan} plan allows up to{' '}
        {subscription.activeChatbotLimit} active chatbot
        {subscription.activeChatbotLimit === 1 ? '' : 's'}, and you currently
        have {subscription.activeChatbotCount}. Archive active chatbots or
        upgrade your subscription to unlock editing and unarchive actions.
      </AlertDescription>
    </Alert>
  );
}
