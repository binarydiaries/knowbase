import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { documents } from '../../db/schema/documents';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { OrgUsageDailyService, OrgUsageMonthlyService } from './usage';

export const PLAN_LIMITS = {
  free: {
    agents: 1,
    knowledgeSources: 10,
    messagesPerMonth: 100,
    trainingRunsPerDay: 3,
  },
  starter: {
    agents: 3,
    knowledgeSources: 250,
    messagesPerMonth: 500,
    trainingRunsPerDay: 10,
  },
  growth: {
    agents: 10,
    knowledgeSources: 1000,
    messagesPerMonth: 2000,
    trainingRunsPerDay: 20,
  },
  pro: {
    agents: 30,
    knowledgeSources: 5000,
    messagesPerMonth: 8000,
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
  static async getRecord(orgId: string) {
    return db.query.orgSubscriptions.findFirst({ where: { orgId } });
  }

  static async getPlan(orgId: string): Promise<PlanName> {
    const record = await this.getRecord(orgId);
    return normalizePlanName(record?.plan) ?? 'free';
  }

  static getLimits(plan: PlanName) {
    return PLAN_LIMITS[plan];
  }

  static async getStatus(orgId: string) {
    const record = await this.getRecord(orgId);
    const plan = normalizePlanName(record?.plan) ?? 'free';
    const subscriptionStatus = record?.status ?? null;
    const limits = this.getLimits(plan);
    const activeAgentLimit = limits.agents;
    const knowledgeSourceLimit = limits.knowledgeSources;
    const messagesPerMonthLimit = limits.messagesPerMonth;
    const trainingRunsPerDayLimit = limits.trainingRunsPerDay;

    const [{ value: activeAgentCount }] = await db
      .select({ value: count() })
      .from(agents)
      .where(
        and(eq(agents.orgId, orgId), eq(agents.agentStatus, 'active')),
      );

    const [{ value: knowledgeSourceCount }] = await db
      .select({ value: count() })
      .from(documents)
      .innerJoin(agents, eq(documents.agentId, agents.id))
      .where(eq(agents.orgId, orgId));

    const trainingRunsToday =
      await OrgUsageDailyService.getTodayTrainingRuns(orgId);
    const messagesThisMonth =
      await OrgUsageMonthlyService.getCurrentMonthAssistantMessages(orgId);

    return {
      plan,
      subscriptionStatus,
      scheduledPlan: record?.scheduledPlan ?? null,
      scheduledPlanAt: record?.scheduledPlanAt?.toISOString() ?? null,
      activeAgentLimit,
      activeAgentCount,
      knowledgeSourceLimit,
      knowledgeSourceCount,
      messagesPerMonthLimit,
      messagesThisMonth,
      trainingRunsPerDayLimit,
      trainingRunsToday,
      isOverLimit: activeAgentCount > activeAgentLimit,
      hasReachedKnowledgeSourceLimit:
        knowledgeSourceCount >= knowledgeSourceLimit,
      hasReachedMessagesPerMonthLimit:
        messagesThisMonth >= messagesPerMonthLimit,
      hasReachedTrainingRunsPerDayLimit:
        trainingRunsToday >= trainingRunsPerDayLimit,
    };
  }

  static hasReachedAgentLimit(
    status: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return status.activeAgentCount >= status.activeAgentLimit;
  }

  static isAgentLocked({
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
    return `Your ${subscriptionStatus.plan} plan allows up to ${subscriptionStatus.activeAgentLimit} active agent${subscriptionStatus.activeAgentLimit === 1 ? '' : 's'}. Archive active agents or upgrade your subscription to create more.`;
  }

  static getLockedMessage(
    subscriptionStatus: Awaited<ReturnType<typeof this.getStatus>>,
  ) {
    return `Your organization is over the ${subscriptionStatus.plan} plan limit of ${subscriptionStatus.activeAgentLimit} active agent${subscriptionStatus.activeAgentLimit === 1 ? '' : 's'}. Archive active agents or upgrade your subscription to edit agent settings.`;
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

  static planHasLeadGeneration(plan: PlanName): boolean {
    return plan !== 'free';
  }

  static async assertLeadGenerationAccess(orgId: string) {
    const plan = await this.getPlan(orgId);
    const allowed = this.planHasLeadGeneration(plan);
    return { allowed, plan };
  }

  static planHasPaidChannels(plan: PlanName): boolean {
    return plan !== 'free';
  }

  static async assertPaidChannelAccess(orgId: string) {
    const plan = await this.getPlan(orgId);
    const allowed = this.planHasPaidChannels(plan);
    return { allowed, plan };
  }

  static getPaidChannelMessage(plan: PlanName): string {
    return `Your ${plan} plan does not include WhatsApp or Instagram channels. Upgrade your subscription to access these channels.`;
  }

  static async assertAgentLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);

    if (this.hasReachedAgentLimit(subscriptionStatus)) {
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
