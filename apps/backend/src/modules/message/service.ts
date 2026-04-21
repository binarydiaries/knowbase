import { db } from '../../db';
import { messages } from '../../db/schema/messages';

export abstract class MessageService {
  static async addMessages(data: (typeof messages.$inferInsert)[]) {
    return db.insert(messages).values(data).returning();
  }

  static async getMessages({
    conversationId,
    orgId,
  }: {
    conversationId: string;
    orgId: string;
  }) {
    return db.query.messages.findMany({
      where: {
        conversationId,
        conversation: {
          agent: { orgId },
        },
      },
    });
  }
}
