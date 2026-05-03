import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import {
  type CheckoutBodySchema,
  postSubscriptionsCancel,
  postSubscriptionsCheckout,
} from '@/services';
import { loadRazorpayScript } from '@/utils/razorpay';

function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
}

export function useCheckoutMutation() {
  const posthog = usePostHog();
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: async (plan: CheckoutBodySchema['plan']) => {
      const loaded = await loadRazorpayScript();
      if (!loaded)
        throw new Error('Failed to load payment gateway. Please try again.');

      const res = await postSubscriptionsCheckout({ body: { plan } });
      const { provider, subscriptionId, clientToken } = res.data;

      if (provider !== 'razorpay')
        throw new Error(`Unsupported payment provider: ${provider}`);

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
    mutationFn: () =>
      postSubscriptionsCancel({ body: { immediate: false } }),
    onSuccess: () => {
      invalidate();
      posthog.capture('subscription_cancelled', { immediate: false });
      toast.success(
        "Subscription cancelled. You'll keep full access until the end of your billing period.",
      );
    },
    onError: () => {
      toast.error('Failed to cancel subscription. Please try again.');
    },
  });
}
