import { useQuery } from '@tanstack/react-query';
import { getFeatureFlags } from '@/services';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => getFeatureFlags(),
    staleTime: 5 * 60 * 1000,
  });
}
