import { createId } from '@paralleldrive/cuid2';
import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

export const roleEnum = pgEnum('role', ['system', 'user', 'assistant']);

export const messages = pgTable('messages', {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  conversationId: text()
    .notNull()
    .references(() => conversations.id),
  role: roleEnum().notNull(),
  parts: jsonb(),
  metadata: jsonb(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
