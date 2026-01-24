import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { behaviors, chatbots } from '../../db/schema';

export abstract class ChatbotService {
  static async create(data: typeof chatbots.$inferInsert) {
    return await db.transaction(async (tx) => {
      const [chatbot] = await tx.insert(chatbots).values(data).returning();

      const chatbotId = chatbot.id;
      await tx
        .insert(behaviors)
        .values({
          chatbotId,
          systemPrompt:
            'You are a helpful support assistant. Answer using the provided sources only.',
          tone: 'neutral',
          verbosity: 'balanced',
          fallbackMessage:
            "I don't know the answer to that based on the information I have.",
        })
        .returning();

      return chatbot;
    });
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
