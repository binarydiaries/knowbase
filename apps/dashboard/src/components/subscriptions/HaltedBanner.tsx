import { AlertTriangle } from 'lucide-react';

export function HaltedBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm max-w-6xl">
      <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-destructive">Payment failed</p>
        <p className="text-muted-foreground mt-0.5">
          We couldn't collect payment for your subscription. Please re-subscribe to restore access, or contact support.
        </p>
      </div>
    </div>
  );
}
