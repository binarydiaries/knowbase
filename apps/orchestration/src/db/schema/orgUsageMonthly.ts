import { index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { clerkOrgIdColumn, cuid2PrimaryKey, timestamps } from '../utils/columns.js';

export const orgUsageMonthly = pgTable(
  'org_usage_monthly',
  {
    id: cuid2PrimaryKey,
    ...clerkOrgIdColumn,
    monthKey: text().notNull(),
    assistantMessages: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('org_usage_monthly_org_month_unique').on(table.orgId, table.monthKey),
    index('org_usage_monthly_org_idx').on(table.orgId),
  ],
);
