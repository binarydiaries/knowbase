import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { documents } from '../../db/schema/documents';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { OrgUsageDailyService, OrgUsageMonthlyService } from './usage';
import { PLANS, type PlanName } from './plans';
import { FeatureFlagService } from '../featureFlag/service';
import { getDefaultProvider } from './providers';
export type { PlanName } from './plans';

const PLAN_NAMES = new Set<PlanName>(['free', 'starter', 'growth', 'pro']);

function normalizePlanName(value: unknown): PlanName | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (PLAN_NAMES.has(v as PlanName)) return v as PlanName;
  for (const plan of PLAN_NAMES) {
    if (v.includes(plan)) return plan;
  }
  return null;
}

const TERMINAL_STATUSES = new Set(['cancelled', 'expired', 'completed']);

interface SubscriptionState {
  plan: PlanName;
  status: string | null;
  currentPeriodEnd: Date | null;
  pendingPlan: PlanName | null;
}

export abstract class SubscriptionService {
  private static async getState(orgId: string): Promise<SubscriptionState> {
    const provider = getDefaultProvider();

    if (provider.getSubscription) {
      const result = await provider.getSubscription(orgId).catch(() => null);

      if (!result || TERMINAL_STATUSES.has(result.status)) {
        return { plan: 'free', status: result?.status ?? null, currentPeriodEnd: null, pendingPlan: null };
      }

      const plan = normalizePlanName(result.plan) ?? 'free';
      return { plan, status: result.status, currentPeriodEnd: result.currentPeriodEnd, pendingPlan: null };
    }

    // Razorpay: read from local DB
    const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });
    const rawPlan = normalizePlanName(record?.plan) ?? 'free';
    const plan: PlanName = record?.status === 'created' ? 'free' : rawPlan;
    const pendingPlan: PlanName | null =
      record?.status === 'created' && rawPlan !== 'free' ? rawPlan : null;
    return { plan, status: record?.status ?? null, currentPeriodEnd: record?.currentPeriodEnd ?? null, pendingPlan };
  }

  static getLimits(plan: PlanName) {
    return PLANS[plan].limits;
  }

  static async getPlan(orgId: string): Promise<PlanName> {
    const { plan } = await this.getState(orgId);
    return plan;
  }

  static async getStatus(orgId: string) {
    const state = await this.getState(orgId);
    const { plan, status: subscriptionStatus, currentPeriodEnd, pendingPlan } = state;
    const limits = this.getLimits(plan);

    const [{ value: activeAgentCount }] = await db
      .select({ value: count() })
      .from(agents)
      .where(and(eq(agents.orgId, orgId), eq(agents.agentStatus, 'active')));

    const [{ value: knowledgeSourceCount }] = await db
      .select({ value: count() })
      .from(documents)
      .innerJoin(agents, eq(documents.agentId, agents.id))
      .where(eq(agents.orgId, orgId));

    const trainingRunsToday = await OrgUsageDailyService.getTodayTrainingRuns(orgId);
    const messagesThisMonth = await OrgUsageMonthlyService.getCurrentMonthAssistantMessages(orgId);

    return {
      plan,
      subscriptionStatus,
      pendingPlan,
      currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
      activeAgentLimit: limits.agents,
      activeAgentCount,
      knowledgeSourceLimit: limits.knowledgeSources,
      knowledgeSourceCount,
      messagesPerMonthLimit: limits.messagesPerMonth,
      messagesThisMonth,
      trainingRunsPerDayLimit: limits.trainingRunsPerDay,
      trainingRunsToday,
      isOverLimit: activeAgentCount > limits.agents,
      hasReachedKnowledgeSourceLimit: knowledgeSourceCount >= limits.knowledgeSources,
      hasReachedMessagesPerMonthLimit: messagesThisMonth >= limits.messagesPerMonth,
      hasReachedTrainingRunsPerDayLimit: trainingRunsToday >= limits.trainingRunsPerDay,
    };
  }

  static hasReachedAgentLimit(status: Awaited<ReturnType<typeof this.getStatus>>) {
    return status.activeAgentCount >= status.activeAgentLimit;
  }

  static isAgentLocked({ subscriptionStatus }: { subscriptionStatus: Awaited<ReturnType<typeof SubscriptionService.getStatus>> }) {
    return subscriptionStatus.isOverLimit;
  }

  static hasReachedKnowledgeSourceLimit(status: Awaited<ReturnType<typeof this.getStatus>>) {
    return status.hasReachedKnowledgeSourceLimit;
  }

  static hasReachedTrainingRunsPerDayLimit(status: Awaited<ReturnType<typeof this.getStatus>>) {
    return status.hasReachedTrainingRunsPerDayLimit;
  }

  static hasReachedMessagesPerMonthLimit(status: Awaited<ReturnType<typeof this.getStatus>>) {
    return status.hasReachedMessagesPerMonthLimit;
  }

  static getLimitReachedMessage(s: Awaited<ReturnType<typeof this.getStatus>>) {
    return `Your ${s.plan} plan allows up to ${s.activeAgentLimit} active agent${s.activeAgentLimit === 1 ? '' : 's'}. Archive active agents or upgrade your subscription to create more.`;
  }

  static getLockedMessage(s: Awaited<ReturnType<typeof this.getStatus>>) {
    return `Your organization is over the ${s.plan} plan limit of ${s.activeAgentLimit} active agent${s.activeAgentLimit === 1 ? '' : 's'}. Archive active agents or upgrade your subscription to edit agent settings.`;
  }

  static getKnowledgeSourceLimitReachedMessage(s: Awaited<ReturnType<typeof this.getStatus>>) {
    return `Your ${s.plan} plan allows up to ${s.knowledgeSourceLimit} knowledge sources. Delete knowledge sources or upgrade your subscription to add more.`;
  }

  static getTrainingLimitReachedMessage(s: Awaited<ReturnType<typeof this.getStatus>>) {
    return `Your ${s.plan} plan allows ${s.trainingRunsPerDayLimit} training runs per day. This limit resets at 00:00 UTC.`;
  }

  static getMessageLimitReachedMessage(s: Awaited<ReturnType<typeof this.getStatus>>) {
    return `Your ${s.plan} plan allows ${s.messagesPerMonthLimit} assistant messages per month. This limit resets at 00:00 UTC on the first day of each month.`;
  }

  static planHasLeadGeneration(plan: PlanName): boolean {
    return plan !== 'free';
  }

  static async assertLeadGenerationAccess(orgId: string) {
    const [plan, flagEnabled] = await Promise.all([
      this.getPlan(orgId),
      FeatureFlagService.isEnabled('lead_generation', orgId),
    ]);
    return { allowed: flagEnabled && this.planHasLeadGeneration(plan), plan };
  }

  static planHasPaidChannels(plan: PlanName): boolean {
    return plan !== 'free';
  }

  static async assertPaidChannelAccess(orgId: string) {
    const plan = await this.getPlan(orgId);
    return { allowed: this.planHasPaidChannels(plan), plan };
  }

  static getPaidChannelMessage(plan: PlanName): string {
    return `Your ${plan} plan does not include WhatsApp or Instagram channels. Upgrade your subscription to access these channels.`;
  }

  static async assertAgentLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);
    return { allowed: !this.hasReachedAgentLimit(subscriptionStatus) as boolean, ...subscriptionStatus };
  }

  static async assertKnowledgeSourceLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);
    return { allowed: !this.hasReachedKnowledgeSourceLimit(subscriptionStatus) as boolean, ...subscriptionStatus };
  }

  static async assertMessagesPerMonthLimitNotReached(orgId: string) {
    const subscriptionStatus = await this.getStatus(orgId);
    return { allowed: !this.hasReachedMessagesPerMonthLimit(subscriptionStatus) as boolean, ...subscriptionStatus };
  }
}
