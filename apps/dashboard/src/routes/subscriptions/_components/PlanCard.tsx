import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { Check, Clock, Loader2, Sparkles } from 'lucide-react';
import type { PaidPlan } from '../_data/plans';
import { formatDate } from '../_utils/razorpay';

interface Plan {
  name: string;
  slug: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
}

interface Props {
  plan: Plan;
  currentPlan: string;
  scheduledPlan: string | null;
  scheduledPlanAt: Date | null;
  isPaid: boolean;
  isBusy: boolean;
  hasScheduledChange: boolean;
  isCheckingOut: boolean;
  onSubscribe: (plan: PaidPlan) => void;
}

export function PlanCard({
  plan,
  currentPlan,
  scheduledPlan,
  scheduledPlanAt,
  isPaid,
  isBusy,
  hasScheduledChange,
  isCheckingOut,
  onSubscribe,
}: Props) {
  const isCurrent = currentPlan === plan.slug;
  const isScheduledTarget = scheduledPlan === plan.slug;
  const isPaidPlan = plan.slug !== 'free';

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-4 ${
        plan.highlight ? 'border-primary shadow-md' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{plan.name}</h2>
        {plan.highlight && !isScheduledTarget && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            Most Popular
          </span>
        )}
        {isScheduledTarget && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
            Scheduled
          </span>
        )}
      </div>

      <div>
        <span className="text-3xl font-bold">{plan.price}</span>
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
        <div className="flex flex-col gap-1">
          <Button variant="outline" disabled className="w-full">
            Current Plan
          </Button>
        </div>
      ) : isScheduledTarget ? (
        <Button variant="outline" disabled className="w-full">
          <Clock className="size-4" />
          Starts {scheduledPlanAt ? formatDate(scheduledPlanAt) : 'at period end'}
        </Button>
      ) : isPaidPlan ? (
        <Button
          className="w-full"
          variant={plan.highlight ? 'default' : 'outline'}
          disabled={isBusy || hasScheduledChange}
          title={hasScheduledChange ? 'Cancel the scheduled plan change first' : undefined}
          onClick={() => onSubscribe(plan.slug as PaidPlan)}
        >
          {isCheckingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="size-4" />
              {isPaid ? 'Switch Plan' : 'Subscribe'}
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
