import { Clock } from 'lucide-react';
import { formatDate } from '@/utils/razorpay';

interface Props {
  expiresOn: Date;
}

export function PendingCancellationBanner({ expiresOn }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm max-w-6xl">
      <Clock className="size-4 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-amber-800">
          Subscription ending {formatDate(expiresOn)}
        </p>
        <p className="text-amber-700 mt-0.5">
          Your subscription has been cancelled. You'll keep full access to all
          paid features until this date, after which your account will revert to
          the free plan.
        </p>
      </div>
    </div>
  );
}
