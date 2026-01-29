import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { behaviors } from './behaviors';

export const channelStatus = pgEnum('status', ['active', 'archived']);

export const chatbots = pgTable('chatbots', {
  id: cuid2PrimaryKey,
  name: text().notNull(),
  description: text(),
  status: channelStatus().notNull().default('active'),
  createdBy: clerkUserId,
  ...clerkOrgIdColumn,
  ...timestamps,
});

export const usersRelations = relations(chatbots, ({ one }) => ({
  behaviour: one(behaviors),
}));
