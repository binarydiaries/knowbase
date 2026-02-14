import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { behaviors, channels, chatbots } from '../../db/schema';
import { DEFAULT_BEHAVIOR } from '../behaviour/defaults';
import { CHANNEL_CONFIG_DEFAULTS } from '../channel/defaults';

export abstract class ChatbotService {
  static async create(data: typeof chatbots.$inferInsert) {
    return await db.transaction(async (tx) => {
      const [chatbot] = await tx.insert(chatbots).values(data).returning();
      const chatbotId = chatbot.id;
      await tx
        .insert(behaviors)
        .values({
          chatbotId,
          createdBy: data.createdBy,
          ...DEFAULT_BEHAVIOR,
        })
        .returning();

      await tx.insert(channels).values({
        chatbotId,
        type: 'web',
        enabled: true,
        config: {
          ...CHANNEL_CONFIG_DEFAULTS,
          displayName: chatbot.name,
        },
        channelStatus: 'active',
        usage: {},
        createdBy: data.createdBy,
      });

      return chatbot;
    });
  }

  static list({ orgId }: { orgId: string }) {
    return db.query.chatbots.findMany({
      where: {
        orgId,
      },
    });
  }

  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.chatbots.findFirst({
      where: {
        id,
        orgId,
      },
    });
  }

  static singleWithRelations({ id, orgId }: { id: string; orgId: string }) {
    return db.query.chatbots.findFirst({
      where: {
        id,
        orgId,
      },
      with: {
        channels: true,
        behaviour: true,
        documents: true,
      },
    });
  }

  static async update(id: string, data: Partial<typeof chatbots.$inferInsert>) {
    const rows = await db
      .update(chatbots)
      .set(data)
      .where(eq(chatbots.id, id))
      .returning();
    return rows[0];
  }
}
