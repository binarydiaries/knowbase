import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const demoBookings = pgTable(
  'demo_bookings',
  {
    id: cuid2PrimaryKey,
    name: text().notNull(),
    email: text().notNull(),
    company: text().notNull(),
    phone: text(),
    category: text(),
    message: text(),
    ...timestamps,
  },
  (t) => [index('demo_bookings_email_idx').on(t.email)],
);
