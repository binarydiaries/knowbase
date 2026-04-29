import { index, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const orgSubscriptions = pgTable(
  'org_subscriptions',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull(),
    plan: text().notNull().default('free'),
    razorpaySubscriptionId: text(),
    razorpayCustomerId: text(),
    // Razorpay subscription statuses: created | authenticated | active | paused | cancelled | halted | completed
    status: text().notNull().default('free'),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('org_subscriptions_org_unique').on(table.orgId),
    uniqueIndex('org_subscriptions_razorpay_sub_unique').on(table.razorpaySubscriptionId),
    index('org_subscriptions_org_idx').on(table.orgId),
  ],
);
