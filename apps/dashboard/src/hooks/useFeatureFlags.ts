import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

export function useFeatureFlags() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/feature-flags`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to load feature flags');
      return response.json() as Promise<Record<string, boolean>>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
