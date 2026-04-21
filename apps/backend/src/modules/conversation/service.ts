import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { conversations } from '../../db/schema/conversations';

export abstract class ConversationService {
  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.conversations.findFirst({
      where: { id, agent: { orgId } },
    });
  }

  static findByExternalId({
    channelId,
    externalId,
  }: {
    channelId: string;
    externalId: string;
  }) {
    return db.query.conversations.findFirst({
      where: { channelId, externalId },
    });
  }

  static async list({
    agentId,
    channelId,
    orgId,
    page,
    limit,
  }: {
    agentId?: string;
    channelId?: string;
    orgId: string;
    page: number;
    limit: number;
  }) {
    const whereCondition = {
      agent: { orgId },
      agentId,
      channelId,
    };

    const offset = (page - 1) * limit;

    const total = (
      await db.query.conversations.findMany({
        where: whereCondition,
        columns: { id: true },
      })
    ).length;

    const list = await db.query.conversations.findMany({
      where: whereCondition,
      orderBy: (table, { desc }) => [desc(table.lastMessageAt)],
      limit,
      offset,
    });

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
