import { createId } from '@paralleldrive/cuid2';
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import type { MessageMetaData, MessageSystemMetaData } from '../../schemas/message.js';
import { conversations } from './conversations.js';

export const roleEnum = pgEnum('role', ['user', 'assistant']);

export const messages = pgTable(
  'messages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text()
      .notNull()
      .references(() => conversations.id),
    role: roleEnum().notNull(),
    content: text().notNull(),
    metadata: jsonb().$type<z.infer<typeof MessageMetaData>>(),
    systemMetadata: jsonb().$type<z.infer<typeof MessageSystemMetaData>>(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_created_idx').on(table.conversationId, table.createdAt),
  ],
);
