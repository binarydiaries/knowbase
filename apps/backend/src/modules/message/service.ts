import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { messages } from '../../db/schema';

export abstract class MessageService {
  static async addMessages(data: (typeof messages.$inferInsert)[]) {
    return db.insert(messages).values(data).returning();
  }

  static async getMessages(conversationId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
  }
}
