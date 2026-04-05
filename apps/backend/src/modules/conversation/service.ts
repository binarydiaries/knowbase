import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import { chatbots } from '../../db/schema/chatbots';
import { conversations } from '../../db/schema/conversations';

export abstract class ConversationService {
  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.conversations.findFirst({
      where: { id, chatbot: { orgId } },
    });
  }

  static async list({
    chatbotId,
    orgId,
    page,
    limit,
  }: {
    chatbotId?: string;
    orgId: string;
    page: number;
    limit: number;
  }) {
    const whereCondition = chatbotId
      ? and(eq(chatbots.orgId, orgId), eq(conversations.chatbotId, chatbotId))
      : eq(chatbots.orgId, orgId);

    const offset = (page - 1) * limit;

    const [totalRow] = await db
      .select({ value: count() })
      .from(conversations)
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .where(whereCondition);

    const total = Number(totalRow?.value ?? 0);

    const list = await db
      .select({
        id: conversations.id,
        chatbotId: conversations.chatbotId,
        channelId: conversations.channelId,
        channelType: channels.type,
        lastUserQuestion: conversations.lastUserQuestion,
        lastAssistantUtterance: conversations.lastAssistantUtterance,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(chatbots, eq(conversations.chatbotId, chatbots.id))
      .innerJoin(channels, eq(conversations.channelId, channels.id))
      .where(whereCondition)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    return {
      conversations: list,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  static async create(data: typeof conversations.$inferInsert) {
    const [doc] = await db.insert(conversations).values(data).returning();
    return doc;
  }

  static async update(
    conversationId: string,
    data: Partial<typeof conversations.$inferInsert>,
  ) {
    const [doc] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, conversationId))
      .returning();
    return doc;
  }
}
