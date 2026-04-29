import { useSubscriptionStatus } from './useSubscriptionStatus';

export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export function useClerkPlan() {
  const { data, isLoading } = useSubscriptionStatus();
  const plan: PlanName = (data?.plan as PlanName) ?? 'free';
  const isPaid = plan !== 'free';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return { plan, isPaid, planLabel, isLoading };
}
