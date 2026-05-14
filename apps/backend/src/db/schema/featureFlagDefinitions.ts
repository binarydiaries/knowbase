import { boolean, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const featureFlagDefinitions = pgTable(
  'feature_flag_definitions',
  {
    id: cuid2PrimaryKey,
    flag: varchar({ length: 128 }).notNull(),
    description: text(),
    globalEnabled: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex('ffd_flag_unique').on(t.flag)],
);
