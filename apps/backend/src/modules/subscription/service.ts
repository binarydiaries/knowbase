import { and, count, eq } from 'drizzle-orm';
import { clerkClient } from 'elysia-clerk';
import { db } from '../../db';
import { chatbots } from '../../db/schema/chatbots';

export const PLAN_LIMITS = {
  free: {
    chatbots: 1,
    knowledgeSources: 25,
    messagesPerMonth: 500,
  },
  starter: {
    chatbots: 3,
    knowledgeSources: 250,
    messagesPerMonth: 5000,
  },
  growth: {
    chatbots: 10,
    knowledgeSources: 1000,
    messagesPerMonth: 20000,
  },
  pro: {
    chatbots: 30,
    knowledgeSources: 5000,
    messagesPerMonth: 75000,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

const PLAN_NAMES = new Set<PlanName>(['free', 'starter', 'growth', 'pro']);

function normalizePlanName(value: unknown): PlanName | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (PLAN_NAMES.has(normalizedValue as PlanName)) {
    return normalizedValue as PlanName;
  }

  for (const plan of PLAN_NAMES) {
    if (normalizedValue.includes(plan)) {
      return plan;
    }
  }

  return null;
}

export abstract class SubscriptionService {
  static async getPlan(orgId: string): Promise<PlanName> {
    try {
      const subscription =
        await clerkClient.billing.getOrganizationBillingSubscription(orgId);

      for (const item of subscription.subscriptionItems) {
        const plan =
          normalizePlanName(item.plan?.slug) ??
          normalizePlanName(item.plan?.name) ??
          normalizePlanName(item.planId);

        if (plan) {
          return plan;
        }
      }
    } catch {
      // Fall back to the default plan if billing is unavailable or no active
      // subscription can be resolved for the organization.
    }

    try {
      const plans = await clerkClient.billing.getPlanList({ payerType: 'org' });
      const defaultPlan = plans.data.find((plan) => plan.isDefault);
      const plan =
        normalizePlanName(defaultPlan?.slug) ??
        normalizePlanName(defaultPlan?.name);

      if (plan) {
        return plan;
      }
    } catch {
      // If billing plan lookup also fails, keep the default free tier.
    }

    return 'free';
  }

  static getLimits(plan: PlanName) {
    return PLAN_LIMITS[plan];
  }

  static async getStatus(orgId: string) {
    const plan = await this.getPlan(orgId);
    const activeChatbotLimit = this.getLimits(plan).chatbots;

    const [{ value: activeChatbotCount }] = await db
      .select({ value: count() })
      .from(chatbots)
      .where(
        and(eq(chatbots.orgId, orgId), eq(chatbots.chatbotStatus, 'active')),
      );

    return {
      plan,
      activeChatbotLimit,
      activeChatbotCount,
      isOverLimit: activeChatbotCount > activeChatbotLimit,
    };
  }

  static hasReachedChatbotLimit(
    status: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return status.activeChatbotCount >= status.activeChatbotLimit;
  }

  static isChatbotLocked({
    subscriptionStatus,
  }: {
    subscriptionStatus: Awaited<
      ReturnType<typeof SubscriptionService.getStatus>
    >;
  }) {
    return subscriptionStatus.isOverLimit;
  }

  static getLimitReachedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your ${subscriptionStatus.plan} plan allows up to ${subscriptionStatus.activeChatbotLimit} active chatbot${subscriptionStatus.activeChatbotLimit === 1 ? '' : 's'}. Archive active chatbots or upgrade your subscription to create more.`;
  }

  static getLockedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your organization is over the ${subscriptionStatus.plan} plan limit of ${subscriptionStatus.activeChatbotLimit} active chatbot${subscriptionStatus.activeChatbotLimit === 1 ? '' : 's'}. Archive active chatbots or upgrade your subscription to edit chatbot settings.`;
  }

  static async assertChatbotLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);

    if (this.hasReachedChatbotLimit(subscriptionStatus)) {
      return {
        allowed: false as const,
        ...subscriptionStatus,
      };
    }

    return {
      allowed: true as const,
      ...subscriptionStatus,
    };
  }
}
