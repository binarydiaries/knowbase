import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import {
  postSubscriptionsCancel,
  postSubscriptionsCheckout,
  type PaidPlan,
} from '@/services';
import { loadRazorpayScript } from '@/utils/razorpay';

function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
}

export function useCheckoutMutation() {
  const posthog = usePostHog();
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: async (plan: PaidPlan) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway. Please try again.');

      const res = await postSubscriptionsCheckout({ body: { plan } });
      const { provider, subscriptionId, clientToken } = res.data;

      if (provider !== 'razorpay') throw new Error(`Unsupported payment provider: ${provider}`);

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: clientToken,
          subscription_id: subscriptionId,
          name: 'Agenvik',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          theme: { color: '#301B69' },
          handler: () => resolve(),
          modal: { ondismiss: () => reject(new Error('dismissed')) },
        });
        rzp.open();
      });

      return { plan };
    },
    onSuccess: ({ plan }) => {
      invalidate();
      posthog.capture('subscription_checkout_completed', { plan });
    },
    onError: (err: Error) => {
      if (err.message !== 'dismissed') {
        toast.error(err.message || 'Checkout failed. Please try again.');
      }
    },
  });
}

export function useCancelMutation() {
  const posthog = usePostHog();
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: (immediate: boolean) => postSubscriptionsCancel({ body: { immediate } }),
    onSuccess: (_, immediate) => {
      invalidate();
      posthog.capture('subscription_cancelled', { immediate });
      toast.success(
        immediate
          ? 'Subscription cancelled. A prorated refund will be credited within 5–7 business days.'
          : "Subscription cancelled. You'll keep access until the end of your billing period.",
      );
    },
    onError: () => {
      toast.error('Failed to cancel subscription. Please try again.');
    },
  });
}
