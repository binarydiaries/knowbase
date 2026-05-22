import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  clerkOrgIdColumn,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';

export const orgUsageDaily = pgTable(
  'org_usage_daily',
  {
    id: cuid2PrimaryKey,
    ...clerkOrgIdColumn,
    // One row per org per UTC day for usage limits like training runs.
    dateKey: text().notNull(),
    trainingRuns: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('org_usage_daily_org_day_unique').on(
      table.orgId,
      table.dateKey,
    ),
    index('org_usage_daily_org_idx').on(table.orgId),
  ],
);
