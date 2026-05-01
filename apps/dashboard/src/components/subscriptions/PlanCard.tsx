import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { PaidPlan, PlanItemSchema } from '@/services';

interface Props {
  plan: PlanItemSchema;
  currentPlan: string;
  hasActiveSubscription: boolean;
  isBusy: boolean;
  isCheckingOut: boolean;
  onSubscribe: (plan: PaidPlan) => void;
}

export function PlanCard({
  plan,
  currentPlan,
  hasActiveSubscription,
  isBusy,
  isCheckingOut,
  onSubscribe,
}: Props) {
  const isCurrent = currentPlan === plan.slug;
  const isPaidPlan = plan.slug !== 'free';

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-4 ${
        plan.highlight ? 'border-primary shadow-md' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{plan.name}</h2>
        {plan.highlight && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            Most Popular
          </span>
        )}
      </div>

      <div>
        <span className="text-3xl font-bold">{plan.priceDisplay}</span>
        <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
      </div>

      <Separator />

      <ul className="flex flex-col gap-2 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="outline" disabled className="w-full">
          Current Plan
        </Button>
      ) : isPaidPlan && !hasActiveSubscription ? (
        <Button
          className="w-full"
          variant={plan.highlight ? 'default' : 'outline'}
          disabled={isBusy}
          onClick={() => onSubscribe(plan.slug as PaidPlan)}
        >
          {isCheckingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="size-4" />
              Subscribe
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
