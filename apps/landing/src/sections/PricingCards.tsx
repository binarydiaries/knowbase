import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Check } from 'lucide-react';

export const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying Knowbase and small personal projects.',
    badge: null,
    features: [
      '1 chatbot',
      '10 knowledge sources',
      '100 messages / month',
      '3 training runs / day',
      'Web channel',
    ],
    cta: 'Get started free',
    variant: 'outline' as const,
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/month',
    description: 'For scaling businesses with higher volume and advanced needs.',
    badge: 'Most Popular',
    features: [
      '10 chatbots',
      '1,000 knowledge sources',
      '2,000 messages / month',
      '20 training runs / day',
      'Web, WhatsApp & Instagram',
      'Full analytics dashboard',
    ],
    cta: 'Start Growth plan',
    variant: 'default' as const,
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    description: 'For enterprises and high-traffic customer support at scale.',
    badge: null,
    features: [
      '30 chatbots',
      '5,000 knowledge sources',
      '8,000 messages / month',
      '40 training runs / day',
      'Web, WhatsApp & Instagram',
      'Full analytics dashboard',
      'Priority support',
    ],
    cta: 'Start Pro plan',
    variant: 'outline' as const,
    highlight: false,
  },
];

export default function PricingCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative flex flex-col transition-shadow hover:shadow-md ${
            plan.highlight
              ? 'border-primary shadow-lg ring-2 ring-primary'
              : ''
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge>{plan.badge}</Badge>
            </div>
          )}

          <CardHeader className={plan.badge ? 'pt-6' : ''}>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-3xl">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <CardDescription className="text-sm">{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <ul className="space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <Button variant={plan.variant} className="w-full" asChild>
              <a href="http://localhost:4001">{plan.cta}</a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
