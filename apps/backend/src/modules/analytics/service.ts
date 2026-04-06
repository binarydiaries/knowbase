import { and, count, desc, eq, gte, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import { chatbots } from '../../db/schema/chatbots';
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
      .from(chatbots)
      .leftJoin(conversations, eq(conversations.chatbotId, chatbots.id))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(chatbots.orgId, orgId));

    // Query 2: avg confidence score from assistant messages
    const [conf] = await db
      .select({
        avg: sql<string | null>`avg((${messages.metadata}->>'confidenceScore')::numeric)`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(eq(chatbots.orgId, orgId), eq(messages.role, 'assistant')),
      );

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
    chatbotId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${conversations.createdAt})::date::text`,
        count: count(),
      })
      .from(conversations)
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('day', ${conversations.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${conversations.createdAt})::date`);

    const countMap = new Map<string, number>(rows.map((r) => [r.date, r.count]));
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
    chatbotId?: string,
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
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
        ),
      )
      .groupBy(channels.type);

    return { data: rows };
  }

  /** Top chatbots ranked by conversation count in date range */
  static async getTopChatbots(
    orgId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    // Date filter in JOIN condition so chatbots with 0 conversations still appear
    const rows = await db
      .select({
        chatbotId: chatbots.id,
        chatbotName: chatbots.name,
        conversations: count(conversations.id),
        messages: count(messages.id),
        avgConfidence: sql<string | null>`avg((${messages.metadata}->>'confidenceScore')::numeric)`,
      })
      .from(chatbots)
      .leftJoin(
        conversations,
        and(
          eq(conversations.chatbotId, chatbots.id),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
        ),
      )
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(chatbots.orgId, orgId))
      .groupBy(chatbots.id, chatbots.name)
      .orderBy(desc(count(conversations.id)))
      .limit(10);

    return { data: rows };
  }

  /** Sentiment breakdown for assistant messages */
  static async getSentimentBreakdown(
    orgId: string,
    startDate: string,
    endDate: string,
    chatbotId?: string,
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
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          sql`${messages.metadata}->'sentiment' is not null`,
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
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
    chatbotId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        topic: conversations.topic,
        count: count(),
      })
      .from(conversations)
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          isNotNull(conversations.topic),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
        ),
      )
      .groupBy(conversations.topic)
      .orderBy(desc(count()))
      .limit(10);

    return {
      data: rows.filter((r): r is { topic: string; count: number } => r.topic !== null),
    };
  }

  /** Top 20 countries by conversation count */
  static async getCountryDistribution(
    orgId: string,
    startDate: string,
    endDate: string,
    chatbotId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        country: conversations.country,
        count: count(),
      })
      .from(conversations)
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          isNotNull(conversations.country),
          gte(conversations.createdAt, start),
          lt(conversations.createdAt, end),
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
        ),
      )
      .groupBy(conversations.country)
      .orderBy(desc(count()))
      .limit(20);

    return {
      data: rows.filter((r): r is { country: string; count: number } => r.country !== null),
    };
  }
}
