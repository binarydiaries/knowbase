import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';

export const statusEnum = pgEnum('status', ['draft', 'live', 'archived']);

export const chatbots = pgTable('chatbots', {
  id: cuid2PrimaryKey,
  name: text().notNull(),
  description: text(),
  status: statusEnum().notNull(),
  createdBy: clerkUserId,
  ...clerkOrgIdColumn,
  ...timestamps,
});
