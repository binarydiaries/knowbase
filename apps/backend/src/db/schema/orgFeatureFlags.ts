import { boolean, index, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const orgFeatureFlags = pgTable(
  'org_feature_flags',
  {
    id: cuid2PrimaryKey,
    flag: varchar({ length: 128 }).notNull(),
    orgId: varchar({ length: 64 }).notNull(),
    enabled: boolean().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('off_flag_org_unique').on(t.flag, t.orgId),
    index('off_flag_idx').on(t.flag),
    index('off_org_idx').on(t.orgId),
  ],
);
