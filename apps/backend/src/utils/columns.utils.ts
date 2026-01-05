import { createId } from '@paralleldrive/cuid2';
import { text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const timestamps = {
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
};

export const clerkUserId = varchar({ length: 64 }).notNull();

export const clerkOrgIdColumn = {
  orgId: varchar({ length: 64 }).notNull(),
};

export const cuid2PrimaryKey = text()
  .primaryKey()
  .$defaultFn(() => createId());
