import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { documents } from '../../db/schema/documents';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { OrgUsageDailyService, OrgUsageMonthlyService } from './usage';
import { PLANS, type PlanName } from './plans';
export type { PlanName } from './plans';

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
    const rawPlan = normalizePlanName(record?.plan) ?? 'free';
    return record?.status === 'created' ? 'free' : rawPlan;
  }

  static getLimits(plan: PlanName) {
    return PLANS[plan].limits;
  }

  static async getStatus(orgId: string) {
    const record = await this.getRecord(orgId);
    // 'created' means checkout initiated but payment not yet confirmed — treat as free
    const rawPlan = normalizePlanName(record?.plan) ?? 'free';
    const plan: PlanName =
      record?.status === 'created' ? 'free' : rawPlan;
    const pendingPlan: PlanName | null =
      record?.status === 'created' && rawPlan !== 'free' ? rawPlan : null;
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
      pendingPlan,
      currentPeriodEnd: record?.currentPeriodEnd?.toISOString() ?? null,
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
    // LEAD_GENERATION_DISABLED: change condition back to `plan !== 'free'` to restore
    if (process.env.LEAD_GENERATION_ENABLED !== 'true') return false;
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
