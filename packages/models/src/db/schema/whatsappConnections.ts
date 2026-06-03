import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../utils/columns.js';

export const whatsappConnections = pgTable(
  'whatsapp_connections',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull().unique(),
    accessToken: text().notNull(),
    businessAccountId: text().notNull(),
    ...timestamps,
  },
  (t) => [index('wa_connections_org_idx').on(t.orgId)],
);
