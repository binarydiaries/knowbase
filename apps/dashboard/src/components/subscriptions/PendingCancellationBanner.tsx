import { Button } from '@knowbase/ui/components/button';
import { Clock, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/razorpay';

interface Props {
  expiresOn: Date;
  isBusy: boolean;
  isCancellingNow: boolean;
  onCancelNow: () => void;
}

export function PendingCancellationBanner({ expiresOn, isBusy, isCancellingNow, onCancelNow }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm max-w-6xl">
      <Clock className="size-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-amber-800">
          Subscription expires on {formatDate(expiresOn)}
        </p>
        <p className="text-amber-700 mt-0.5">
          You'll keep full access until then. This cancellation cannot be undone.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={onCancelNow}
        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        {isCancellingNow ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          'Cancel now instead'
        )}
      </Button>
    </div>
  );
}
