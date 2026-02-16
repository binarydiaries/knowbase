import type { InferSelectModel } from 'drizzle-orm';
import {
  index,
  integer,
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

export const documentStatus = pgEnum('status', [
  'draft',
  'ready',
  'queue',
  'indexing',
  'indexed',
  'failed',
]);

export const documents = pgTable(
  'documents',
  {
    id: cuid2PrimaryKey,
    title: text().notNull(),
    contentSerialized: jsonb().notNull(),
    version: integer().notNull().default(1),
    type: text().$type<'text' | 'qna'>().notNull(),
    status: documentStatus().notNull().default('draft'),
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

export type IDocument = InferSelectModel<typeof documents>;
