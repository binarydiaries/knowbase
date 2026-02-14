import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
} from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const channelType = pgEnum('type', ['web', 'whatsapp', 'instagram']);
export const channelStatus = pgEnum('channelStatus', [
  'inactive',
  'active',
  'error',
]);

export const channels = pgTable(
  'channels',
  {
    id: cuid2PrimaryKey,
    chatbotId: text()
      .notNull()
      .references(() => chatbots.id),
    type: channelType().notNull(),
    enabled: boolean().notNull().default(false),
    config: jsonb().$type<object>().notNull(),
    channelStatus: channelStatus().notNull().default('inactive'),
    usage: jsonb().$type<object>().notNull(),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    // 🔥 Fast lookup by chatbot
    index('channels_chatbot_idx').on(table.chatbotId),
  ],
);
