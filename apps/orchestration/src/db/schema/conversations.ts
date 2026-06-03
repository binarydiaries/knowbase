import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../utils/columns.js';
import { agents } from './agents.js';
import { channels } from './channels.js';

export const conversations = pgTable(
  'conversations',
  {
    id: cuid2PrimaryKey,
    agentId: text().notNull().references(() => agents.id),
    channelId: text().notNull().references(() => channels.id),
    lastUserQuestion: text().notNull(),
    lastAssistantUtterance: text().notNull(),
    lastMessageAt: timestamp({ withTimezone: true }).notNull(),
    country: text(),
    topic: text(),
    externalId: text(),
    entities: jsonb('entities').$type<Record<string, string>>(),
    ...timestamps,
  },
  (table) => [
    index('conversations_agent_idx').on(table.agentId),
    index('conversations_agent_lastmsg_idx').on(table.agentId, table.lastMessageAt),
    index('conversations_channel_external_idx').on(table.channelId, table.externalId),
  ],
);
