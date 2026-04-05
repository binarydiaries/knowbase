import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import type { IChannelSchema } from './model';

export abstract class ChannelService {
  static async list({
    chatbotId,
    orgId,
  }: {
    chatbotId?: string;
    orgId: string;
  }) {
    return db.query.channels.findMany({
      where: chatbotId
        ? { chatbotId, chatbot: { orgId } }
        : { chatbot: { orgId } },
    });
  }

  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.channels.findFirst({
      where: { id, chatbot: { orgId } },
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
