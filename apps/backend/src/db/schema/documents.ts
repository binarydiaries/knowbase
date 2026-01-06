import { pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const documents = pgTable('documents', {
  id: cuid2PrimaryKey,
  content: text().notNull(),
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  createdBy: clerkUserId,
  ...clerkOrgIdColumn,
  ...timestamps,
});
