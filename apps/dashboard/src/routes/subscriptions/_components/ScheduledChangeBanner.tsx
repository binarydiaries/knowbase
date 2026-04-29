import { Button } from '@knowbase/ui/components/button';
import { Clock, Loader2 } from 'lucide-react';
import { formatDate } from '../_utils/razorpay';

interface Props {
  scheduledPlan: string;
  scheduledPlanAt: Date;
  isBusy: boolean;
  isCancelling: boolean;
  onCancelScheduledChange: () => void;
}

export function ScheduledChangeBanner({
  scheduledPlan,
  scheduledPlanAt,
  isBusy,
  isCancelling,
  onCancelScheduledChange,
}: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm max-w-6xl">
      <Clock className="size-4 text-blue-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-blue-800">
          Plan switch scheduled for {formatDate(scheduledPlanAt)}
        </p>
        <p className="text-blue-700 mt-0.5">
          You're switching to <span className="font-semibold capitalize">{scheduledPlan}</span> on{' '}
          {formatDate(scheduledPlanAt)}. Your current plan stays active until then — no double billing.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={onCancelScheduledChange}
        className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
      >
        {isCancelling ? <Loader2 className="size-3 animate-spin" /> : 'Keep current plan'}
      </Button>
    </div>
  );
}
