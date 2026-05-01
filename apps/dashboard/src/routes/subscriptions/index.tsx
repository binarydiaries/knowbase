import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { createFileRoute } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { HaltedBanner } from '@/components/subscriptions/HaltedBanner';
import { PendingCancellationBanner } from '@/components/subscriptions/PendingCancellationBanner';
import { PlanCard } from '@/components/subscriptions/PlanCard';
import { SubscriptionActions } from '@/components/subscriptions/SubscriptionActions';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import {
  useCancelMutation,
  useCheckoutMutation,
} from '@/hooks/useSubscriptionMutations';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import type { CheckoutBodySchema } from '@/services';
import { formatDate } from '@/utils/razorpay';

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  const posthog = usePostHog();
  const { plan, isPaid, isPendingCancellation, isHalted, currentPeriodEnd } =
    useClerkPlan();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();

  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelMutation();

  const isBusy = checkoutMutation.isPending || cancelMutation.isPending;
  const hasActiveSubscription = isPaid || isPendingCancellation;

  useEffect(() => {
    posthog.capture('subscription_page_viewed');
  }, [posthog]);

  function handleCancelAtPeriodEnd() {
    const dateStr = currentPeriodEnd
      ? ` on ${formatDate(currentPeriodEnd)}`
      : ' at the end of your billing period';
    if (
      !confirm(
        `Cancel at end of billing period? You'll keep full access${dateStr}. This cannot be undone.`,
      )
    )
      return;
    cancelMutation.mutate(false);
  }

  function handleCancelNow() {
    if (
      !confirm(
        'Cancel immediately? A prorated refund will be issued for unused time.',
      )
    )
      return;
    cancelMutation.mutate(true);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Subscriptions</h1>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {isHalted && <HaltedBanner />}

        {isPendingCancellation && currentPeriodEnd && (
          <PendingCancellationBanner
            expiresOn={currentPeriodEnd}
            isBusy={isBusy}
            isCancellingNow={
              cancelMutation.isPending && cancelMutation.variables === true
            }
            onCancelNow={handleCancelNow}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl">
          {plansLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={+i} className="h-80 rounded-2xl" />
              ))
            : plans?.map((p) => (
                <PlanCard
                  key={p.slug}
                  plan={p}
                  currentPlan={plan}
                  hasActiveSubscription={hasActiveSubscription}
                  isBusy={isBusy}
                  isCheckingOut={
                    checkoutMutation.isPending &&
                    checkoutMutation.variables === p.slug
                  }
                  onSubscribe={(slug: CheckoutBodySchema['plan']) =>
                    checkoutMutation.mutate(slug)
                  }
                />
              ))}
        </div>

        {isPaid && (
          <SubscriptionActions
            isPendingCancellation={isPendingCancellation}
            isBusy={isBusy}
            isCancellingAtPeriodEnd={
              cancelMutation.isPending && cancelMutation.variables === false
            }
            isCancellingNow={
              cancelMutation.isPending && cancelMutation.variables === true
            }
            onCancelAtPeriodEnd={handleCancelAtPeriodEnd}
            onCancelNow={handleCancelNow}
          />
        )}
      </div>
    </>
  );
}
