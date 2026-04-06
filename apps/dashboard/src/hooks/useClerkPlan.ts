import { useSubscription } from '@clerk/clerk-react/experimental';

export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

const KNOWN_PLANS = new Set<PlanName>(['free', 'starter', 'growth', 'pro']);

function normalizePlan(slug: string | undefined | null): PlanName {
  const lower = slug?.trim().toLowerCase() ?? '';
  if (KNOWN_PLANS.has(lower as PlanName)) return lower as PlanName;
  for (const plan of KNOWN_PLANS) {
    if (lower.includes(plan)) return plan;
  }
  return 'free';
}

/**
 * Returns the current org plan name directly from Clerk — no backend call needed.
 * Falls back to 'free' while loading or if no subscription exists.
 */
export function useClerkPlan() {
  const { data: subscription, isLoading } = useSubscription({
    for: 'organization',
  });

  const slug = subscription?.subscriptionItems?.[0]?.plan?.slug;
  const plan = normalizePlan(slug);
  const isPaid = plan !== 'free';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return { plan, isPaid, planLabel, isLoading };
}
