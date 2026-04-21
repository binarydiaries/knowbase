import type { InferSelectModel } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { agents } from './agents';

export const documentStatus = pgEnum('status', [
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
    status: documentStatus().notNull().default('ready'),
    lastIndexedVersion: integer(),
    lastTrainedAt: timestamp({ withTimezone: true }),
    agentId: text()
      .notNull()
      .references(() => agents.id),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    // 🔥 Primary listing pattern
    index('documents_agent_idx').on(table.agentId),

    // 🔥 Agent + status filtering
    index('documents_agent_status_idx').on(table.agentId, table.status),
  ],
);

export type IDocument = InferSelectModel<typeof documents>;
