import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../utils/columns.js';

export const slackConnections = pgTable(
  'slack_connections',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull().unique(),
    botToken: text().notNull(),
    teamId: varchar({ length: 64 }).notNull(),
    teamName: text().notNull(),
    botUserId: text().notNull(),
    ...timestamps,
  },
  (t) => [index('slack_connections_org_idx').on(t.orgId)],
);
