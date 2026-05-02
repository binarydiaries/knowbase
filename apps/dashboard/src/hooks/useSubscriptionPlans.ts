import { useQuery } from '@tanstack/react-query';
import { getSubscriptionsPlans } from '@/services';

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await getSubscriptionsPlans();
      return res.data.plans;
    },
    staleTime: Infinity,
  });
}
