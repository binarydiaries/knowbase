import { useSubscriptionStatus } from './useSubscriptionStatus';

export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export function useClerkPlan() {
  const { data, isLoading } = useSubscriptionStatus();
  const plan: PlanName = (data?.plan as PlanName) ?? 'free';
  const isPaid = plan !== 'free';
  const subscriptionStatus = data?.subscriptionStatus ?? null;
  const isPendingCancellation = subscriptionStatus === 'pending_cancellation';
  const isHalted = subscriptionStatus === 'halted';
  const currentPeriodEnd = data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
  const pendingPlan = data?.pendingPlan ?? null;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return { plan, isPaid, isPendingCancellation, isHalted, currentPeriodEnd, pendingPlan, planLabel, isLoading };
}
