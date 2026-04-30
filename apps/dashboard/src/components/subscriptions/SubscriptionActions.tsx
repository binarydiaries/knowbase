import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/razorpay';

interface Props {
  isPendingCancellation: boolean;
  hasScheduledChange: boolean;
  scheduledPlanAt: Date | null;
  isBusy: boolean;
  isResuming: boolean;
  isCancelling: boolean;
  onResume: () => void;
  onCancel: () => void;
}

export function SubscriptionActions({
  isPendingCancellation,
  hasScheduledChange,
  scheduledPlanAt,
  isBusy,
  isResuming,
  isCancelling,
  onResume,
  onCancel,
}: Props) {
  if (hasScheduledChange) return null;

  return (
    <div className="max-w-sm space-y-4">
      <Separator />

      {isPendingCancellation ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your subscription is set to cancel{' '}
            {scheduledPlanAt ? `on ${formatDate(scheduledPlanAt)}` : 'at the end of the billing period'}. Changed
            your mind?
          </p>
          <Button variant="outline" size="sm" disabled={isBusy} onClick={onResume}>
            {isResuming ? <Loader2 className="size-4 animate-spin" /> : 'Resume Subscription'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cancelling keeps your access active until the end of the current billing period.
          </p>
          <Button variant="destructive" size="sm" disabled={isBusy} onClick={onCancel}>
            {isCancelling ? <Loader2 className="size-4 animate-spin" /> : 'Cancel Subscription'}
          </Button>
        </div>
      )}
    </div>
  );
}
