import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema';
import type { IChannelSchema } from './model';

export abstract class ChannelService {
  static async list({
    chatbotId,
  }: {
    chatbotId: string;
  }): Promise<IChannelSchema[]> {
    return (await db
      .select()
      .from(channels)
      .where(eq(channels.chatbotId, chatbotId))) as IChannelSchema[];
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
