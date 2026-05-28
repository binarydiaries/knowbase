import { desc, eq, max, sql } from 'drizzle-orm';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { conversations } from '../../db/schema/conversations';
import { messages } from '../../db/schema/messages';
import { orgUsageMonthly } from '../../db/schema/orgUsageMonthly';
import { resolveOrgNames } from '../../utils/clerkOrg.utils';

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export abstract class AdminOrgsOverviewService {
  static async getOrgsOverview() {
    const monthKey = currentMonthKey();

    const rows = await db
      .select({
        orgId: agents.orgId,
        agentCount: sql<number>`cast(count(distinct ${agents.id}) as int)`,
        conversationCount: sql<number>`cast(count(distinct ${conversations.id}) as int)`,
        messageCount: sql<number>`cast(count(${messages.id}) as int)`,
        lastActiveAt: max(conversations.lastMessageAt),
      })
      .from(agents)
      .leftJoin(conversations, eq(conversations.agentId, agents.id))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(agents.orgId)
      .orderBy(desc(max(conversations.lastMessageAt)));

    const usageRows = await db
      .select({
        orgId: orgUsageMonthly.orgId,
        assistantMessages: orgUsageMonthly.assistantMessages,
      })
      .from(orgUsageMonthly)
      .where(eq(orgUsageMonthly.monthKey, monthKey));

    const usageByOrg = new Map(usageRows.map((r) => [r.orgId, r.assistantMessages]));

    const orgIds = rows.map((r) => r.orgId);
    const orgNames = await resolveOrgNames(orgIds);

    const data = rows.map((row) => ({
      orgId: row.orgId,
      orgName: orgNames.get(row.orgId) ?? null,
      agentCount: row.agentCount,
      conversationCount: row.conversationCount,
      messageCount: Number(row.messageCount ?? 0),
      lastActiveAt: row.lastActiveAt ?? null,
      currentMonthMessages: usageByOrg.get(row.orgId) ?? 0,
    }));

    const totals = data.reduce(
      (acc, row) => ({
        orgCount: acc.orgCount + 1,
        agentCount: acc.agentCount + row.agentCount,
        conversationCount: acc.conversationCount + row.conversationCount,
        messageCount: acc.messageCount + row.messageCount,
      }),
      { orgCount: 0, agentCount: 0, conversationCount: 0, messageCount: 0 },
    );

    return { data, meta: { ...totals, monthKey } };
  }
}
