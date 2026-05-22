import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const calcomConnections = pgTable(
  'calcom_connections',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull().unique(),
    calApiKey: text().notNull(),
    ...timestamps,
  },
  (t) => [index('calcom_connections_org_idx').on(t.orgId)],
);
