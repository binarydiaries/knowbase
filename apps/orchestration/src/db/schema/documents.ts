import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { clerkUserId, cuid2PrimaryKey, timestamps } from '../utils/columns.js';
import { agents } from './agents.js';

export const documentStatus = pgEnum('status', [
  'ready', 'queue', 'indexing', 'indexed', 'failed',
]);

export const documents = pgTable(
  'documents',
  {
    id: cuid2PrimaryKey,
    title: text().notNull(),
    contentSerialized: jsonb().notNull(),
    version: integer().notNull().default(1),
    type: text().$type<'text' | 'qna' | 'pdf' | 'url'>().notNull(),
    status: documentStatus().notNull().default('ready'),
    lastIndexedVersion: integer(),
    lastTrainedAt: timestamp({ withTimezone: true }),
    agentId: text().notNull().references(() => agents.id),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    index('documents_agent_idx').on(table.agentId),
    index('documents_agent_status_idx').on(table.agentId, table.status),
  ],
);
