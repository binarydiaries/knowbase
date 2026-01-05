import { db } from '../../db';
import { chatbots } from '../../db/schema/chatbots';

export abstract class ChatbotService {
  static async create(data: typeof chatbots.$inferInsert) {
    const rows = await db.insert(chatbots).values(data).returning();
    return rows[0];
  }
}
