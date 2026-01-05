import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { chatbots } from '../../db/schema/chatbots';

export abstract class ChatbotService {
  static async create(data: typeof chatbots.$inferInsert) {
    const rows = await db.insert(chatbots).values(data).returning();
    return rows[0];
  }

  static list() {
    return db.select().from(chatbots);
  }

  static single({ id }: { id: string }) {
    return db.query.chatbots.findFirst({ where: eq(chatbots.id, id) });
  }

  static async update(id: string, data: Partial<typeof chatbots.$inferInsert>) {
    const rows = await db
      .update(chatbots)
      .set(data)
      .where(eq(chatbots.id, id))
      .returning();
    return rows[0];
  }

  static async delete(id: string) {
    return db.delete(chatbots).where(eq(chatbots.id, id));
  }
}
