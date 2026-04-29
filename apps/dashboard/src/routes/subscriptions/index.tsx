import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@knowbase/ui/components/button';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import { postSubscriptionsCheckout, postSubscriptionsCancel } from '@/services';

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

type PaidPlan = 'starter' | 'growth' | 'pro';

const PLANS = [
  {
    name: 'Free',
    slug: 'free' as const,
    price: '₹0',
    period: 'forever',
    highlight: false,
    features: [
      '1 active agent',
      '10 knowledge sources',
      '100 messages / month',
      '3 training runs / day',
    ],
  },
  {
    name: 'Starter',
    slug: 'starter' as PaidPlan,
    price: '₹499',
    period: '/month',
    highlight: false,
    features: [
      '3 active agents',
      '250 knowledge sources',
      '500 messages / month',
      '10 training runs / day',
      'WhatsApp & Instagram channels',
      'Lead generation',
    ],
  },
  {
    name: 'Growth',
    slug: 'growth' as PaidPlan,
    price: '₹1,499',
    period: '/month',
    highlight: true,
    features: [
      '10 active agents',
      '1,000 knowledge sources',
      '2,000 messages / month',
      '20 training runs / day',
      'WhatsApp & Instagram channels',
      'Lead generation',
      'Analytics',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro' as PaidPlan,
    price: '₹3,999',
    period: '/month',
    highlight: false,
    features: [
      '30 active agents',
      '5,000 knowledge sources',
      '8,000 messages / month',
      '40 training runs / day',
      'WhatsApp & Instagram channels',
      'Lead generation',
      'Analytics',
      'Priority support',
    ],
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function RouteComponent() {
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const { plan: currentPlan, isPaid } = useClerkPlan();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | 'cancel' | null>(null);

  useEffect(() => {
    posthog.capture('subscription_page_viewed');
  }, [posthog]);

  async function handleSubscribe(plan: PaidPlan) {
    setLoadingPlan(plan);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.');
        return;
      }

      const res = await postSubscriptionsCheckout({ body: { plan } });
      const { provider, subscriptionId, clientToken } = res.data;

      if (provider !== 'razorpay') {
        alert(`Unsupported payment provider: ${provider}`);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: clientToken,
          subscription_id: subscriptionId,
          name: 'Agenvik',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          theme: { color: '#301B69' },
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
            posthog.capture('subscription_checkout_completed', { plan });
            resolve();
          },
          modal: {
            ondismiss: () => reject(new Error('dismissed')),
          },
        });
        rzp.open();
      });
    } catch (err: any) {
      if (err?.message !== 'dismissed') {
        console.error('Checkout error:', err);
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription? Your plan will revert to Free.')) return;
    setLoadingPlan('cancel');
    try {
      await postSubscriptionsCancel();
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      posthog.capture('subscription_cancelled');
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Subscriptions</h1>
        </div>
      </header>
      <Separator />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.slug;
            const isPaidPlan = plan.slug !== 'free';

            return (
              <div
                key={plan.slug}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                  plan.highlight
                    ? 'border-primary shadow-md'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.highlight && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>

                <Separator />

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : isPaidPlan ? (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                    disabled={loadingPlan !== null}
                    onClick={() => handleSubscribe(plan.slug as PaidPlan)}
                  >
                    {loadingPlan === plan.slug ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Subscribe
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {isPaid && (
          <div className="mt-8 max-w-sm">
            <Separator className="mb-6" />
            <p className="text-sm text-muted-foreground mb-3">
              Want to cancel your subscription? Your plan will revert to Free at the end of the billing period.
            </p>
            <Button
              variant="destructive"
              size="sm"
              disabled={loadingPlan !== null}
              onClick={handleCancel}
            >
              {loadingPlan === 'cancel' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
