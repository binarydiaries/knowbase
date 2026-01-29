import { boolean, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import type { ChannelConfigSchema } from '../../modules/channel/model';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const channelType = pgEnum('type', ['web', 'whatsapp', 'instagram']);
export const channelStatus = pgEnum('channelStatus', [
  'inactive',
  'active',
  'error',
]);

export const channels = pgTable('channels', {
  id: cuid2PrimaryKey,
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  type: channelType().notNull(),
  enabled: boolean().notNull().default(false),
  config: jsonb().$type<z.infer<typeof ChannelConfigSchema>>().notNull(),
  status: channelStatus().notNull().default('inactive'),
  usage: jsonb().notNull(),
  ...timestamps,
});
