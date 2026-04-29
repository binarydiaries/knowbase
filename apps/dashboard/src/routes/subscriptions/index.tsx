import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { Check, Sparkles, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@knowbase/ui/components/button';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import {
  postSubscriptionsCheckout,
  postSubscriptionsCancel,
  postSubscriptionsResume,
  postSubscriptionsCancelScheduledChange,
} from '@/services';

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

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function RouteComponent() {
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const {
    plan: currentPlan,
    isPaid,
    isPendingCancellation,
    isHalted,
    scheduledPlan,
    scheduledPlanAt,
  } = useClerkPlan();

  const [loadingAction, setLoadingAction] = useState<PaidPlan | 'cancel' | 'resume' | 'cancel-scheduled' | null>(null);

  const hasScheduledChange = !!scheduledPlan;

  useEffect(() => {
    posthog.capture('subscription_page_viewed');
  }, [posthog]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  }

  async function handleSubscribe(plan: PaidPlan) {
    setLoadingAction(plan);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.');
        return;
      }

      const res = await postSubscriptionsCheckout({ body: { plan } });
      const { provider, subscriptionId, clientToken, scheduledFor } = res.data;

      if (provider !== 'razorpay') {
        alert(`Unsupported payment provider: ${provider}`);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: clientToken,
          subscription_id: subscriptionId,
          name: 'Agenvik',
          description: scheduledFor
            ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — starts ${formatDate(new Date(scheduledFor))}`
            : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          theme: { color: '#301B69' },
          handler: () => {
            invalidate();
            posthog.capture('subscription_checkout_completed', { plan, scheduledFor });
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
      setLoadingAction(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel? You'll keep full access until the end of your current billing period.")) return;
    setLoadingAction('cancel');
    try {
      await postSubscriptionsCancel();
      invalidate();
      posthog.capture('subscription_cancelled');
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResume() {
    if (!confirm('Resume your subscription? Your plan will continue as normal after the current billing period.')) return;
    setLoadingAction('resume');
    try {
      await postSubscriptionsResume();
      invalidate();
      posthog.capture('subscription_resumed');
    } catch (err) {
      console.error('Resume error:', err);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancelScheduledChange() {
    if (!confirm('Cancel the scheduled plan change? Your current plan will remain active.')) return;
    setLoadingAction('cancel-scheduled');
    try {
      await postSubscriptionsCancelScheduledChange();
      invalidate();
      posthog.capture('subscription_scheduled_change_cancelled');
    } catch (err) {
      console.error('Cancel scheduled change error:', err);
    } finally {
      setLoadingAction(null);
    }
  }

  const isBusy = loadingAction !== null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium flex-1">Subscriptions</h1>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {/* Payment failed banner */}
        {isHalted && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm max-w-6xl">
            <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Payment failed</p>
              <p className="text-muted-foreground mt-0.5">
                We couldn't collect payment for your subscription. Please re-subscribe to restore access, or contact support.
              </p>
            </div>
          </div>
        )}

        {/* Scheduled change banner */}
        {hasScheduledChange && scheduledPlanAt && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm max-w-6xl">
            <Clock className="size-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">
                Plan switch scheduled for {formatDate(scheduledPlanAt)}
              </p>
              <p className="text-blue-700 mt-0.5">
                You're switching to <span className="font-semibold capitalize">{scheduledPlan}</span> on {formatDate(scheduledPlanAt)}.
                Your current plan stays active until then — no double billing.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleCancelScheduledChange}
              className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {loadingAction === 'cancel-scheduled' ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                'Keep current plan'
              )}
            </Button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.slug;
            const isScheduledTarget = scheduledPlan === plan.slug;
            const isPaidPlan = plan.slug !== 'free';

            return (
              <div
                key={plan.slug}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                  plan.highlight ? 'border-primary shadow-md' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.highlight && !isScheduledTarget && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  {isScheduledTarget && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                      Scheduled
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
                  <div className="flex flex-col gap-1">
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                    {isPendingCancellation && !hasScheduledChange && (
                      <p className="text-xs text-muted-foreground text-center">
                        Cancels {scheduledPlanAt ? `on ${formatDate(scheduledPlanAt)}` : 'at period end'}
                      </p>
                    )}
                  </div>
                ) : isScheduledTarget ? (
                  <Button variant="outline" disabled className="w-full">
                    <Clock className="size-4" />
                    Starts {scheduledPlanAt ? formatDate(scheduledPlanAt) : 'at period end'}
                  </Button>
                ) : isPaidPlan ? (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                    disabled={isBusy || hasScheduledChange}
                    title={hasScheduledChange ? 'Cancel the scheduled plan change first' : undefined}
                    onClick={() => handleSubscribe(plan.slug as PaidPlan)}
                  >
                    {loadingAction === plan.slug ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        {isPaid ? 'Switch Plan' : 'Subscribe'}
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Bottom action area */}
        {isPaid && (
          <div className="max-w-sm space-y-4">
            <Separator />

            {isPendingCancellation && !hasScheduledChange ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your subscription is set to cancel at the end of the billing period. Changed your mind?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleResume}
                >
                  {loadingAction === 'resume' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Resume Subscription'
                  )}
                </Button>
              </div>
            ) : !hasScheduledChange ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cancelling keeps your access active until the end of the current billing period.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleCancel}
                >
                  {loadingAction === 'cancel' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
