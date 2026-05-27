import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { createFileRoute } from '@tanstack/react-router';
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
import {KQPrice, usePricing, useSubscriptions} from "@kelviq/react-sdk";

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { plan, isPaid, isPendingCancellation, isHalted, currentPeriodEnd, pendingPlan } =
    useClerkPlan();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
    const { data: subscriptions } = useSubscriptions();
    const { data: pricing } = usePricing();


    console.log('pricing',pricing)

    const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelMutation();

  const isBusy = checkoutMutation.isPending || cancelMutation.isPending;
  const hasActiveSubscription = isPaid || isPendingCancellation;

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
          <PendingCancellationBanner expiresOn={currentPeriodEnd} />
        )}

          <KQPrice
              planIdentifier="pro-plan"
              billingPeriod="MONTHLY"
              fallback={<p>Price not available</p>}
          >
              {({ formattedPrice, isFree, hasFreeTrial, trialPeriod }) => (
                  <div>
                      <h3>{formattedPrice}</h3>
                      {hasFreeTrial && <p>{trialPeriod}-day free trial</p>}
                  </div>
              )}
          </KQPrice>

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
                  pendingPlan={pendingPlan}
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
            currentPeriodEnd={currentPeriodEnd}
            isBusy={isBusy}
            isCancelling={cancelMutation.isPending}
            onConfirmCancel={() => cancelMutation.mutate()}
          />
        )}
      </div>
    </>
  );
}
