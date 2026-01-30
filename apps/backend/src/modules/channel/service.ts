import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema';
import type { IChannelSchema } from './model';

export abstract class ChannelService {
  static async list({ chatbotId }: { chatbotId: string }) {
    return db.select().from(channels).where(eq(channels.chatbotId, chatbotId));
  }

  static single(id: string) {
    return db.query.channels.findFirst({
      where: eq(channels.id, id),
    });
  }

  static async create(data: typeof channels.$inferInsert) {
    const [channel] = await db.insert(channels).values(data).returning();
    return channel;
  }

  static async update(id: string, data: Partial<typeof channels.$inferInsert>) {
    const [channel] = await db
      .update(channels)
      .set(data)
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  static transformChannel(
    channel: typeof channels.$inferSelect,
  ): IChannelSchema {
    return {
      ...channel,
      additional: {
        type: channel.type,
        config: channel.config,
      },
    };
  }
}
