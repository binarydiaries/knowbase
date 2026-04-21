import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { AlertTriangle } from 'lucide-react';

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'growth' | 'pro';
  activeAgentLimit: number;
  activeAgentCount: number;
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
      <AlertTitle>Agent editing is locked</AlertTitle>
      <AlertDescription>
        Your {subscription.plan} plan allows up to{' '}
        {subscription.activeAgentLimit} active agent
        {subscription.activeAgentLimit === 1 ? '' : 's'}, and you currently
        have {subscription.activeAgentCount}. Archive active agents or
        upgrade your subscription to unlock editing and unarchive actions.
      </AlertDescription>
    </Alert>
  );
}
