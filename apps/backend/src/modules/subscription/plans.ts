export type PlanName = 'free' | 'starter' | 'growth' | 'pro';
export type PaidPlanName = 'starter' | 'growth' | 'pro';

export interface PlanItem {
  slug: PlanName;
  name: string;
  priceMonthlyPaise: number;
  priceDisplay: string;
  period: string;
  highlight: boolean;
  features: string[];
  limits: {
    agents: number;
    knowledgeSources: number;
    messagesPerMonth: number;
    trainingRunsPerDay: number;
  };
}

export const PLANS: Record<PlanName, PlanItem> = {
  free: {
    slug: 'free',
    name: 'Free',
    priceMonthlyPaise: 0,
    priceDisplay: '₹0',
    period: 'forever',
    highlight: false,
    features: [
      '1 active agent',
      '10 knowledge sources',
      '100 messages / month',
      '3 training runs / day',
    ],
    limits: {
      agents: 1,
      knowledgeSources: 10,
      messagesPerMonth: 100,
      trainingRunsPerDay: 3,
    },
  },
  starter: {
    slug: 'starter',
    name: 'Starter',
    priceMonthlyPaise: 49900,
    priceDisplay: '₹499',
    period: '/month',
    highlight: false,
    features: [
      '3 active agents',
      '250 knowledge sources',
      '500 messages / month',
      '10 training runs / day',
      'WhatsApp',
      // 'Lead generation', // LEAD_GENERATION_DISABLED: uncomment to restore
    ],
    limits: {
      agents: 3,
      knowledgeSources: 250,
      messagesPerMonth: 500,
      trainingRunsPerDay: 10,
    },
  },
  growth: {
    slug: 'growth',
    name: 'Growth',
    priceMonthlyPaise: 149900,
    priceDisplay: '₹1,499',
    period: '/month',
    highlight: true,
    features: [
      '10 active agents',
      '1,000 knowledge sources',
      '2,000 messages / month',
      '20 training runs / day',
      'WhatsApp',
      // 'Lead generation', // LEAD_GENERATION_DISABLED: uncomment to restore
      'Analytics',
    ],
    limits: {
      agents: 10,
      knowledgeSources: 1000,
      messagesPerMonth: 2000,
      trainingRunsPerDay: 20,
    },
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    priceMonthlyPaise: 399900,
    priceDisplay: '₹3,999',
    period: '/month',
    highlight: false,
    features: [
      '30 active agents',
      '5,000 knowledge sources',
      '8,000 messages / month',
      '40 training runs / day',
      'WhatsApp',
      // 'Lead generation', // LEAD_GENERATION_DISABLED: uncomment to restore
      'Analytics',
      'Priority support',
    ],
    limits: {
      agents: 30,
      knowledgeSources: 5000,
      messagesPerMonth: 8000,
      trainingRunsPerDay: 40,
    },
  },
};

export const PLAN_ORDER: PlanName[] = ['free', 'starter', 'growth', 'pro'];
