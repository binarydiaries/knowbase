import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import { agents } from '../../db/schema/agents';
import type { IChannelSchema } from './model';

export abstract class ChannelService {
  static async list({
    agentId,
    orgId,
  }: {
    agentId?: string;
    orgId: string;
  }) {
    return db.query.channels.findMany({
      where: agentId
        ? { agentId, agent: { orgId } }
        : { agent: { orgId } },
    });
  }

  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.channels.findFirst({
      where: { id, agent: { orgId } },
    });
  }

  static async singleById(id: string) {
    const rows = await db
      .select({ channel: channels, orgId: agents.orgId })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(eq(channels.id, id))
      .limit(1);
    if (!rows[0]) return null;
    return { ...rows[0].channel, orgId: rows[0].orgId };
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

  static async findBySlackChannelId(slackChannelId: string, mode: 'channel' | 'mention') {
    const rows = await db
      .select({ channel: channels, agent: agents })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(
        and(
          eq(channels.type, 'slack'),
          sql`${channels.config}->>'slackChannelId' = ${slackChannelId}`,
          sql`${channels.config}->>'mode' = ${mode}`,
        ),
      )
      .limit(1);

    if (!rows[0]) return null;
    return { ...rows[0].channel, agent: rows[0].agent };
  }

  static async findByWhatsappPhoneNumberId(phoneNumberId: string) {
    const rows = await db
      .select({ channel: channels, agent: agents })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(
        and(
          eq(channels.type, 'whatsapp'),
          sql`${channels.config}->>'phoneNumberId' = ${phoneNumberId}`,
        ),
      )
      .limit(1);

    if (!rows[0]) return null;
    return { ...rows[0].channel, agent: rows[0].agent };
  }

  static async findByInstagramAccountId(instagramAccountId: string) {
    const rows = await db
      .select({ channel: channels, agent: agents })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(
        and(
          eq(channels.type, 'instagram'),
          sql`${channels.config}->>'instagramAccountId' = ${instagramAccountId}`,
        ),
      )
      .limit(1);

    if (!rows[0]) return null;
    return { ...rows[0].channel, agent: rows[0].agent };
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
    } as IChannelSchema;
  }
}
