import { useQuery } from '@tanstack/react-query';
import { getSubscriptionsStatus } from '@/services';

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await getSubscriptionsStatus();
      return response.data;
    },
    refetchInterval: 30000,
  });
}
