import { and, count, eq } from 'drizzle-orm';
import { clerkClient } from 'elysia-clerk';
import { db } from '../../db';
import { chatbots } from '../../db/schema/chatbots';
import { documents } from '../../db/schema/documents';
import { OrgUsageDailyService, OrgUsageMonthlyService } from './usage';

export const PLAN_LIMITS = {
  free: {
    chatbots: 1,
    knowledgeSources: 10,
    // This is temp. It should be 500
    messagesPerMonth: 5,
    trainingRunsPerDay: 3,
  },
  starter: {
    chatbots: 3,
    knowledgeSources: 250,
    messagesPerMonth: 5000,
    trainingRunsPerDay: 10,
  },
  growth: {
    chatbots: 10,
    knowledgeSources: 1000,
    messagesPerMonth: 20000,
    trainingRunsPerDay: 20,
  },
  pro: {
    chatbots: 30,
    knowledgeSources: 5000,
    messagesPerMonth: 75000,
    trainingRunsPerDay: 40,
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
    const limits = this.getLimits(plan);
    const activeChatbotLimit = limits.chatbots;
    const knowledgeSourceLimit = limits.knowledgeSources;
    const messagesPerMonthLimit = limits.messagesPerMonth;
    const trainingRunsPerDayLimit = limits.trainingRunsPerDay;

    const [{ value: activeChatbotCount }] = await db
      .select({ value: count() })
      .from(chatbots)
      .where(
        and(eq(chatbots.orgId, orgId), eq(chatbots.chatbotStatus, 'active')),
      );

    const [{ value: knowledgeSourceCount }] = await db
      .select({ value: count() })
      .from(documents)
      .innerJoin(chatbots, eq(documents.chatbotId, chatbots.id))
      .where(eq(chatbots.orgId, orgId));

    const trainingRunsToday =
      await OrgUsageDailyService.getTodayTrainingRuns(orgId);
    const messagesThisMonth =
      await OrgUsageMonthlyService.getCurrentMonthAssistantMessages(orgId);

    return {
      plan,
      activeChatbotLimit,
      activeChatbotCount,
      knowledgeSourceLimit,
      knowledgeSourceCount,
      messagesPerMonthLimit,
      messagesThisMonth,
      trainingRunsPerDayLimit,
      trainingRunsToday,
      isOverLimit: activeChatbotCount > activeChatbotLimit,
      hasReachedKnowledgeSourceLimit:
        knowledgeSourceCount >= knowledgeSourceLimit,
      hasReachedMessagesPerMonthLimit:
        messagesThisMonth >= messagesPerMonthLimit,
      hasReachedTrainingRunsPerDayLimit:
        trainingRunsToday >= trainingRunsPerDayLimit,
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

  static hasReachedKnowledgeSourceLimit(
    status: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return status.hasReachedKnowledgeSourceLimit;
  }

  static hasReachedTrainingRunsPerDayLimit(
    status: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return status.hasReachedTrainingRunsPerDayLimit;
  }

  static hasReachedMessagesPerMonthLimit(
    status: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return status.hasReachedMessagesPerMonthLimit;
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

  static getKnowledgeSourceLimitReachedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your ${subscriptionStatus.plan} plan allows up to ${subscriptionStatus.knowledgeSourceLimit} knowledge sources. Delete knowledge sources or upgrade your subscription to add more.`;
  }

  static getTrainingLimitReachedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your ${subscriptionStatus.plan} plan allows ${subscriptionStatus.trainingRunsPerDayLimit} training runs per day. This limit resets at 00:00 UTC.`;
  }

  static getMessageLimitReachedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your ${subscriptionStatus.plan} plan allows ${subscriptionStatus.messagesPerMonthLimit} assistant messages per month. This limit resets at 00:00 UTC on the first day of each month.`;
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

  static async assertKnowledgeSourceLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);

    if (this.hasReachedKnowledgeSourceLimit(subscriptionStatus)) {
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

  static async assertMessagesPerMonthLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);

    if (this.hasReachedMessagesPerMonthLimit(subscriptionStatus)) {
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
