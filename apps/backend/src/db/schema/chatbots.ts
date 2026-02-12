// import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { behaviors } from './behaviors';

export const chatbotStatus = pgEnum('chatbotStatus', ['active', 'archived']);

export const chatbots = pgTable(
  'chatbots',
  {
    id: cuid2PrimaryKey,
    name: text().notNull(),
    description: text(),
    chatbotStatus: chatbotStatus().notNull().default('active'),
    createdBy: clerkUserId,
    ...clerkOrgIdColumn,
    ...timestamps,
  },
  (t) => [index('chatbots_org_idx').on(t.orgId)],
);

// export const usersRelations = relations(chatbots, ({ one }) => ({
//   behaviour: one(behaviors),
// }));
