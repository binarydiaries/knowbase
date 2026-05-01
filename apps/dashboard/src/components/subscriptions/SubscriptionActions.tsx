import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { Loader2 } from 'lucide-react';

interface Props {
  isPendingCancellation: boolean;
  isBusy: boolean;
  isCancellingAtPeriodEnd: boolean;
  isCancellingNow: boolean;
  onCancelAtPeriodEnd: () => void;
  onCancelNow: () => void;
}

export function SubscriptionActions({
  isPendingCancellation,
  isBusy,
  isCancellingAtPeriodEnd,
  isCancellingNow,
  onCancelAtPeriodEnd,
  onCancelNow,
}: Props) {
  if (isPendingCancellation) return null;

  return (
    <div className="max-w-sm space-y-4">
      <Separator />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          To switch plans, cancel your current subscription and subscribe to a new one.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" disabled={isBusy} onClick={onCancelAtPeriodEnd}>
            {isCancellingAtPeriodEnd ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Cancel at end of billing period'
            )}
          </Button>
          <Button variant="destructive" size="sm" disabled={isBusy} onClick={onCancelNow}>
            {isCancellingNow ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Cancel now (prorated refund)'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
