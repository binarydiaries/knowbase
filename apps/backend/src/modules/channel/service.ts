import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema';

export abstract class ChannelService {
  static list({ chatbotId }: { chatbotId: string }) {
    return db.select().from(channels).where(eq(channels.chatbotId, chatbotId));
  }

  static single(id: string) {
    return db.select().from(channels).where(eq(channels.id, id));
  }

  static create(data: typeof channels.$inferInsert) {
    return db.insert(channels).values(data).returning();
  }

  static update(id: string, data: Partial<typeof channels.$inferInsert>) {
    return db.update(channels).set(data).where(eq(channels.id, id)).returning();
  }
}
