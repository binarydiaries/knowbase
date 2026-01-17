import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const documents = pgTable('documents', {
  id: cuid2PrimaryKey,
  title: text().notNull(),
  contentSerialized: jsonb().notNull(),
  /** VERSIONING **/
  version: integer().notNull().default(1),
  type: text().$type<'text' | 'qna'>().notNull(),
  /** TRAINING STATUS **/
  status: text()
    .$type<'draft' | 'ready' | 'indexing' | 'indexed' | 'failed'>()
    .notNull()
    .default('draft'),
  lastIndexedVersion: integer(),
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  createdBy: clerkUserId,
  ...clerkOrgIdColumn,
  ...timestamps,
});
