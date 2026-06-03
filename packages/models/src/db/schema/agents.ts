import { index, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { clerkOrgIdColumn, clerkUserId, cuid2PrimaryKey, timestamps } from '../utils/columns.js';

export const agentStatus = pgEnum('agentStatus', ['active', 'archived']);

export const agents = pgTable(
  'agents',
  {
    id: cuid2PrimaryKey,
    name: text().notNull(),
    description: text(),
    agentStatus: agentStatus().notNull().default('active'),
    createdBy: clerkUserId,
    ...clerkOrgIdColumn,
    ...timestamps,
  },
  (t) => [index('agents_org_idx').on(t.orgId)],
);
