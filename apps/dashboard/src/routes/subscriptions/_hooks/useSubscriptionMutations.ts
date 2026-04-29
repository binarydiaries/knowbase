import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import {
  postSubscriptionsCancel,
  postSubscriptionsCheckout,
  postSubscriptionsCancelScheduledChange,
  postSubscriptionsResume,
} from '@/services';
import type { PaidPlan } from '../_data/plans';
import { formatDate, loadRazorpayScript } from '../_utils/razorpay';

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
      const { provider, subscriptionId, clientToken, scheduledFor } = res.data;

      if (provider !== 'razorpay') throw new Error(`Unsupported payment provider: ${provider}`);

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: clientToken,
          subscription_id: subscriptionId,
          name: 'Agenvik',
          description: scheduledFor
            ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — starts ${formatDate(new Date(scheduledFor))}`
            : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          theme: { color: '#301B69' },
          handler: () => resolve(),
          modal: { ondismiss: () => reject(new Error('dismissed')) },
        });
        rzp.open();
      });

      return { plan, scheduledFor };
    },
    onSuccess: ({ plan, scheduledFor }) => {
      invalidate();
      posthog.capture('subscription_checkout_completed', { plan, scheduledFor });
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
    mutationFn: () => postSubscriptionsCancel(),
    onSuccess: () => {
      invalidate();
      posthog.capture('subscription_cancelled');
      toast.success("Subscription cancelled. You'll keep access until the end of your billing period.");
    },
    onError: () => {
      toast.error('Failed to cancel subscription. Please try again.');
    },
  });
}

export function useResumeMutation() {
  const posthog = usePostHog();
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: () => postSubscriptionsResume(),
    onSuccess: () => {
      invalidate();
      posthog.capture('subscription_resumed');
      toast.success('Subscription resumed. Your plan will continue as normal.');
    },
    onError: () => {
      toast.error('Failed to resume subscription. Please try again.');
    },
  });
}

export function useCancelScheduledChangeMutation() {
  const posthog = usePostHog();
  const invalidate = useInvalidateSubscription();

  return useMutation({
    mutationFn: () => postSubscriptionsCancelScheduledChange(),
    onSuccess: () => {
      invalidate();
      posthog.capture('subscription_scheduled_change_cancelled');
      toast.success('Scheduled plan change cancelled. Your current plan remains active.');
    },
    onError: () => {
      toast.error('Failed to cancel scheduled change. Please try again.');
    },
  });
}
