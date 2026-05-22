import { and, count, desc, eq, gte, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { channels } from '../../db/schema/channels';
import { conversations } from '../../db/schema/conversations';
import { messages } from '../../db/schema/messages';

/** Parse a YYYY-MM-DD string as a UTC midnight Date */
function parseUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/** Format a Date to YYYY-MM-DD in UTC */
function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Return every UTC day (as YYYY-MM-DD strings) from start up to (not including) end */
function eachDayInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  while (cur < end) {
    days.push(formatUtcDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export abstract class AnalyticsService {
  /** All-time overview stats — no date filter */
  static async getOverview(orgId: string) {
    // Query 1: conversation + message counts
    const [counts] = await db
      .select({
        totalConversations: count(conversations.id),
        totalMessages: count(messages.id),
      })
      .from(agents)
      .leftJoin(conversations, eq(conversations.agentId, agents.id))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(agents.orgId, orgId));

    // Query 2: avg confidence score from assistant messages
    const [conf] = await db
      .select({
        avg: sql<
          string | null
        >`avg((${messages.metadata}->>'confidenceScore')::numeric)`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(and(eq(agents.orgId, orgId), eq(messages.role, 'assistant')));

    const totalConversations = counts?.totalConversations ?? 0;
    const totalMessages = counts?.totalMessages ?? 0;
    const avgMessagesPerConv =
      totalConversations > 0
        ? Math.round((totalMessages / totalConversations) * 10) / 10
        : 0;

    return {
      totalConversations,
      totalMessages,
      avgMessagesPerConv,
      avgConfidenceScore: conf?.avg ?? null,
    };
  }

  /** Daily conversation counts with gap-fill */
  static async getConversationsDaily(
    orgId: string,
    startDate: string,
    endDate: string,
    agentId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${conversations.createdAt})::date::text`,
        count: count(),
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(agents.orgId, orgId),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('day', ${conversations.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${conversations.createdAt})::date`);

    const countMap = new Map<string, number>(
      rows.map((r) => [r.date, r.count]),
    );
    const data = eachDayInRange(start, end).map((dateStr) => ({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
    }));

    return { data };
  }

  /** Messages grouped by channel type */
  static async getMessagesByChannel(
    orgId: string,
    startDate: string,
    endDate: string,
    agentId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        channelType: channels.type,
        count: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(channels, eq(conversations.channelId, channels.id))
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(agents.orgId, orgId),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .groupBy(channels.type);

    return { data: rows };
  }

  /** Top agents ranked by conversation count in date range */
  static async getTopAgents(orgId: string, startDate: string, endDate: string) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    // Date filter in JOIN condition so agents with 0 conversations still appear
    const rows = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        conversations: count(conversations.id),
        messages: count(messages.id),
        avgConfidence: sql<
          string | null
        >`avg((${messages.metadata}->>'confidenceScore')::numeric)`,
      })
      .from(agents)
      .leftJoin(
        conversations,
        and(
          eq(conversations.agentId, agents.id),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
        ),
      )
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(agents.orgId, orgId))
      .groupBy(agents.id, agents.name)
      .orderBy(desc(count(conversations.id)))
      .limit(10);

    return { data: rows };
  }

  /** Sentiment breakdown for assistant messages */
  static async getSentimentBreakdown(
    orgId: string,
    startDate: string,
    endDate: string,
    agentId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        label: sql<string>`${messages.metadata}->'sentiment'->>'label'`,
        count: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(agents.orgId, orgId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          sql`${messages.metadata}->'sentiment' is not null`,
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .groupBy(sql`${messages.metadata}->'sentiment'->>'label'`);

    return { data: rows.filter((r) => r.label !== null) };
  }

  /** Top 10 conversation topics in date range */
  static async getTopTopics(
    orgId: string,
    startDate: string,
    endDate: string,
    agentId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        topic: conversations.topic,
        count: count(),
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(agents.orgId, orgId),
          isNotNull(conversations.topic),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .groupBy(conversations.topic)
      .orderBy(desc(count()))
      .limit(10);

    return {
      data: rows.filter(
        (r): r is { topic: string; count: number } => r.topic !== null,
      ),
    };
  }

  /** Top 20 countries by conversation count */
  static async getCountryDistribution(
    orgId: string,
    startDate: string,
    endDate: string,
    agentId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        country: conversations.country,
        count: count(),
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(agents.orgId, orgId),
          isNotNull(conversations.country),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .groupBy(conversations.country)
      .orderBy(desc(count()))
      .limit(20);

    return {
      data: rows.filter(
        (r): r is { country: string; count: number } => r.country !== null,
      ),
    };
  }
}
