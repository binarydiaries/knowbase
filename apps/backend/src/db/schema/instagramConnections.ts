import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const instagramConnections = pgTable(
  'instagram_connections',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull().unique(),
    pageAccessToken: text().notNull(),
    instagramAccountId: text().notNull(),
    username: text(),
    ...timestamps,
  },
  (t) => [index('ig_connections_org_idx').on(t.orgId)],
);
