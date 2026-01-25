import { relations } from 'drizzle-orm';
import { jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import type { ChatbotSettings } from '../../modules/chatbot/model';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { behaviors } from './behaviors';

export const statusEnum = pgEnum('status', ['draft', 'live', 'archived']);

export const chatbots = pgTable('chatbots', {
  id: cuid2PrimaryKey,
  name: text().notNull(),
  description: text(),
  status: statusEnum().notNull(),
  settings: jsonb().$type<z.infer<typeof ChatbotSettings>>().notNull(),
  createdBy: clerkUserId,
  ...clerkOrgIdColumn,
  ...timestamps,
});

export const usersRelations = relations(chatbots, ({ one }) => ({
  behaviour: one(behaviors),
}));
