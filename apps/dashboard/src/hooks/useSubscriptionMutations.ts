import * as amplitude from '@amplitude/unified';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: async (plan: CheckoutBodySchema['plan']) => {
      const res = await postSubscriptionsCheckout({ body: { plan } });
      const { provider, subscriptionId, clientToken } = res.data;

      if (provider === 'kelviq') {
        // clientToken is the hosted checkout URL — redirect to complete payment
        window.location.href = clientToken;
        return { plan };
      }

      if (provider === 'razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded)
          throw new Error('Failed to load payment gateway. Please try again.');

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
      }

      throw new Error(`Unsupported payment provider: ${provider}`);
    },
    onSuccess: ({ plan }) => {
      invalidate();
      amplitude.track('Subscription Plan Selected', { plan });
    },
    onError: (err: Error) => {
      if (err.message !== 'dismissed') {
        toast.error(err.message || 'Checkout failed. Please try again.');
      }
    },
  });
}

export function useCancelMutation() {
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: () =>
      postSubscriptionsCancel({ body: { immediate: false } }),
    onSuccess: () => {
      invalidate();
      amplitude.track('Subscription Cancelled');
      toast.success(
        "Subscription cancelled. You'll keep full access until the end of your billing period.",
      );
    },
    onError: () => {
      toast.error('Failed to cancel subscription. Please try again.');
    },
  });
}
