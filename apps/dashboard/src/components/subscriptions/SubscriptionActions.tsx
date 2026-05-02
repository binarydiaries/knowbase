import { useState } from 'react';
import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Separator } from '@knowbase/ui/components/separator';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/razorpay';

interface Props {
  isPendingCancellation: boolean;
  currentPeriodEnd: Date | null;
  isBusy: boolean;
  isCancelling: boolean;
  onConfirmCancel: () => void;
}

export function SubscriptionActions({
  isPendingCancellation,
  currentPeriodEnd,
  isBusy,
  isCancelling,
  onConfirmCancel,
}: Props) {
  const [open, setOpen] = useState(false);

  if (isPendingCancellation) return null;

  const periodEndLabel = currentPeriodEnd
    ? formatDate(currentPeriodEnd)
    : 'the end of your billing period';

  function handleConfirm() {
    setOpen(false);
    onConfirmCancel();
  }

  return (
    <>
      <div className="max-w-sm space-y-4">
        <Separator />
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Cancel subscription</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll keep full access to all features until{' '}
              {currentPeriodEnd ? formatDate(currentPeriodEnd) : 'your billing period ends'}.
              After that, your account will revert to the free plan.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => setOpen(true)}
          >
            {isCancelling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Cancel subscription'
            )}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your subscription will be cancelled at the end of the current
                  billing period on{' '}
                  <span className="font-medium text-foreground">
                    {periodEndLabel}
                  </span>
                  .
                </p>
                <p>
                  Until then, you'll continue to have full access to all paid
                  features. After{' '}
                  {currentPeriodEnd ? formatDate(currentPeriodEnd) : 'that date'}
                  , your account will automatically switch to the free plan.
                </p>
                <p>
                  If you change your mind, you can re-subscribe at any time
                  before the period ends.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep subscription
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Yes, cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
