import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { chatbots } from '../../db/schema/chatbots';
import { conversations } from '../../db/schema/conversations';
import { documents } from '../../db/schema/documents';
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

export abstract class UsageChartsService {
  static async getMessagesDaily(
    orgId: string,
    startDate: string,
    endDate: string,
    chatbotId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${messages.createdAt})::date::text`,
        count: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          chatbotId ? eq(conversations.chatbotId, chatbotId) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('day', ${messages.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${messages.createdAt})::date`);

    // Build a lookup map from query results
    const countMap = new Map<string, number>(
      rows.map((r) => [r.date, r.count]),
    );

    // Fill in every day in the range with 0 if no data
    const data = eachDayInRange(start, end).map((dateStr) => ({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
    }));

    return { data };
  }

  static async getMessagesByChatbot(
    orgId: string,
    startDate: string,
    endDate: string,
    chatbotId?: string,
  ) {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);

    const rows = await db
      .select({
        chatbotId: chatbots.id,
        chatbotName: chatbots.name,
        count: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          gte(messages.createdAt, start),
          lt(messages.createdAt, end),
          chatbotId ? eq(chatbots.id, chatbotId) : undefined,
        ),
      )
      .groupBy(chatbots.id, chatbots.name);

    return { data: rows };
  }

  static async getKnowledgeByChatbot(orgId: string, chatbotId?: string) {
    const rows = await db
      .select({
        chatbotId: chatbots.id,
        chatbotName: chatbots.name,
        count: count(),
      })
      .from(documents)
      .innerJoin(chatbots, eq(documents.chatbotId, chatbots.id))
      .where(
        and(
          eq(chatbots.orgId, orgId),
          chatbotId ? eq(chatbots.id, chatbotId) : undefined,
        ),
      )
      .groupBy(chatbots.id, chatbots.name);

    return { data: rows };
  }
}
