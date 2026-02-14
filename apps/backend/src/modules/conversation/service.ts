import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { conversations } from '../../db/schema/conversations';

export abstract class ConversationService {
  static single({ id }: { id: string }) {
    return db.query.conversations.findFirst({
      where: { id },
    });
  }

  static list({ chatbotId }: { chatbotId?: string }) {
    return db.query.conversations.findMany({
      where: { chatbotId },
    });
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
