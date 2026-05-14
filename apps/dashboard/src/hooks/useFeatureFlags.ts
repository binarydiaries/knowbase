import { useQuery } from '@tanstack/react-query';
import { client } from '@/services/client.gen.ts';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data } = await client.get<Record<string, boolean>>({
        url: '/feature-flags',
        responseType: 'json',
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
