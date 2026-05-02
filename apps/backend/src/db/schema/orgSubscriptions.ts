import { index, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const orgSubscriptions = pgTable(
  'org_subscriptions',
  {
    id: cuid2PrimaryKey,
    orgId: varchar({ length: 64 }).notNull(),
    plan: text().notNull().default('free'),
    provider: text().notNull().default('razorpay'),
    providerSubscriptionId: text(),
    providerCustomerId: text(),
    // created | authenticated | active | pending_cancellation | paused | cancelled | halted | completed | transitioning
    status: text().notNull().default('free'),
    currentPeriodStart: timestamp({ withTimezone: true }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    lastPaymentId: text(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('org_subscriptions_org_unique').on(table.orgId),
    uniqueIndex('org_subscriptions_provider_sub_unique').on(table.providerSubscriptionId),
    index('org_subscriptions_org_idx').on(table.orgId),
  ],
);
