import { index, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const documents = pgTable(
  'documents',
  {
    id: cuid2PrimaryKey,
    title: text().notNull(),
    contentSerialized: jsonb().notNull(),
    version: integer().notNull().default(1),
    type: text().$type<'text' | 'qna'>().notNull(),
    status: text()
      .$type<'draft' | 'ready' | 'indexing' | 'indexed' | 'failed'>()
      .notNull()
      .default('draft'),
    lastIndexedVersion: integer(),
    chatbotId: text()
      .notNull()
      .references(() => chatbots.id),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    // 🔥 Primary listing pattern
    index('documents_chatbot_idx').on(table.chatbotId),

    // 🔥 Chatbot + status filtering
    index('documents_chatbot_status_idx').on(table.chatbotId, table.status),
  ],
);
