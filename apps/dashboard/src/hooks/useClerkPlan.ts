import { useSubscriptionStatus } from './useSubscriptionStatus';

export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export function useClerkPlan() {
  const { data, isLoading } = useSubscriptionStatus();
  const plan: PlanName = (data?.plan as PlanName) ?? 'free';
  const isPaid = plan !== 'free';
  const subscriptionStatus = data?.subscriptionStatus ?? null;
  const isPendingCancellation = subscriptionStatus === 'pending_cancellation';
  const isHalted = subscriptionStatus === 'halted';
  const scheduledPlan = data?.scheduledPlan ?? null;
  const scheduledPlanAt = data?.scheduledPlanAt ? new Date(data.scheduledPlanAt) : null;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return { plan, isPaid, isPendingCancellation, isHalted, scheduledPlan, scheduledPlanAt, planLabel, isLoading };
}
