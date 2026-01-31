import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { channels } from './channels';
import { chatbots } from './chatbots';

export const conversations = pgTable('conversations', {
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
  ...timestamps,
});
