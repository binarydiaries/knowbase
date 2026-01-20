import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const conversationChannel = pgEnum('channel', [
  'web',
  'whatsapp',
  'instagram',
]);

export const conversations = pgTable('conversations', {
  id: cuid2PrimaryKey,
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  channel: conversationChannel().notNull(),
  lastUserQuestion: text().notNull(),
  lastAssistantUtterance: text().notNull(),
  lastMessageAt: timestamp({ withTimezone: true }).notNull(),
  ...timestamps,
});
