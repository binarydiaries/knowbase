import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { chatbotActions, type LeadGenerationConfig } from '../../db/schema/chatbotActions';

export abstract class ActionService {
  static getEnabledByChatbot(chatbotId: string) {
    return db.query.chatbotActions.findMany({
      where: { chatbotId, enabled: true },
    });
  }

  static getByChatbot(chatbotId: string) {
    return db.query.chatbotActions.findMany({
      where: { chatbotId },
    });
  }

  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.chatbotActions.findFirst({
      where: { id, chatbot: { orgId } },
    });
  }

  static async create(data: typeof chatbotActions.$inferInsert) {
    const rows = await db.insert(chatbotActions).values(data).returning();
    return rows[0];
  }

  static async update(
    id: string,
    data: { enabled?: boolean; config?: LeadGenerationConfig },
  ) {
    const rows = await db
      .update(chatbotActions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatbotActions.id, id))
      .returning();
    return rows[0];
  }

  static async delete(id: string) {
    const rows = await db
      .delete(chatbotActions)
      .where(eq(chatbotActions.id, id))
      .returning();
    return rows[0];
  }
}
