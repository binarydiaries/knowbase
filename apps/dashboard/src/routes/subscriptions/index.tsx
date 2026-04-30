import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import { PLANS, type PaidPlan } from '@/data/subscriptionPlans';
import {
  useCancelMutation,
  useCancelScheduledChangeMutation,
  useCheckoutMutation,
  useResumeMutation,
} from '@/hooks/useSubscriptionMutations';
import { HaltedBanner } from '@/components/subscriptions/HaltedBanner';
import { PlanCard } from '@/components/subscriptions/PlanCard';
import { ScheduledChangeBanner } from '@/components/subscriptions/ScheduledChangeBanner';
import { SubscriptionActions } from '@/components/subscriptions/SubscriptionActions';

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  const posthog = usePostHog();
  const { plan, isPaid, isPendingCancellation, isHalted, scheduledPlan, scheduledPlanAt } = useClerkPlan();

  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelMutation();
  const resumeMutation = useResumeMutation();
  const cancelScheduledMutation = useCancelScheduledChangeMutation();

  const isBusy =
    checkoutMutation.isPending ||
    cancelMutation.isPending ||
    resumeMutation.isPending ||
    cancelScheduledMutation.isPending;

  const hasScheduledChange = !!scheduledPlan;

  useEffect(() => {
    posthog.capture('subscription_page_viewed');
  }, [posthog]);

  function handleCancel() {
    if (!confirm("Are you sure you want to cancel? You'll keep full access until the end of your current billing period.")) return;
    cancelMutation.mutate();
  }

  function handleResume() {
    if (!confirm('Resume your subscription? Your plan will continue as normal after the current billing period.')) return;
    resumeMutation.mutate();
  }

  function handleCancelScheduledChange() {
    if (!confirm('Cancel the scheduled plan change? Your current plan will remain active.')) return;
    cancelScheduledMutation.mutate();
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium flex-1">Subscriptions</h1>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {isHalted && <HaltedBanner />}

        {hasScheduledChange && scheduledPlanAt && (
          <ScheduledChangeBanner
            scheduledPlan={scheduledPlan!}
            scheduledPlanAt={scheduledPlanAt}
            isBusy={isBusy}
            isCancelling={cancelScheduledMutation.isPending}
            onCancelScheduledChange={handleCancelScheduledChange}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl">
          {PLANS.map((p) => (
            <PlanCard
              key={p.slug}
              plan={p}
              currentPlan={plan}
              scheduledPlan={scheduledPlan}
              scheduledPlanAt={scheduledPlanAt}
              isPaid={isPaid}
              isBusy={isBusy}
              hasScheduledChange={hasScheduledChange}
              isCheckingOut={checkoutMutation.isPending && checkoutMutation.variables === p.slug}
              onSubscribe={(slug: PaidPlan) => checkoutMutation.mutate(slug)}
            />
          ))}
        </div>

        {isPaid && (
          <SubscriptionActions
            isPendingCancellation={isPendingCancellation}
            hasScheduledChange={hasScheduledChange}
            scheduledPlanAt={scheduledPlanAt}
            isBusy={isBusy}
            isResuming={resumeMutation.isPending}
            isCancelling={cancelMutation.isPending}
            onResume={handleResume}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
}
