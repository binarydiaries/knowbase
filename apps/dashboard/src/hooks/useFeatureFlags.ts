import { useQuery } from '@tanstack/react-query';
import { getFeatureFlags } from '@/services';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const results = await getFeatureFlags();
      return results.data as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
