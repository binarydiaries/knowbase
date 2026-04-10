import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { channels } from './channels';
import { chatbots } from './chatbots';

export const conversations = pgTable(
  'conversations',
  {
    id: cuid2PrimaryKey,
    chatbotId: text()
      .notNull()
      .references(() => chatbots.id),
    channelId: text()
      .notNull()
      .references(() => channels.id),
    lastUserQuestion: text().notNull(),
    lastAssistantUtterance: text().notNull(),
    lastMessageAt: timestamp({ withTimezone: true }).notNull(),
    country: text(),
    topic: text(),
    externalId: text(),
    ...timestamps,
  },
  (table) => [
    // 🔥 Fast lookup per chatbot
    index('conversations_chatbot_idx').on(table.chatbotId),

    // 🔥 Critical: chatbot + ordering
    index('conversations_chatbot_lastmsg_idx').on(
      table.chatbotId,
      table.lastMessageAt,
    ),

    // 🔥 WhatsApp: lookup by sender phone number per channel
    index('conversations_channel_external_idx').on(
      table.channelId,
      table.externalId,
    ),
  ],
);
