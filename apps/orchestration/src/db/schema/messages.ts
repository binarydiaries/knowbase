import { createId } from '@paralleldrive/cuid2';
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { conversations } from './conversations.js';

export type MessageSource = {
  documentId: string;
  documentVersion: number;
  chunkIndex: number;
  similarity: number;
};

export type MessageMetadata = {
  confidenceScore: number | null;
  sources?: MessageSource[] | null;
  sentiment?: { label: 'positive' | 'neutral' | 'negative'; score: number } | null;
};

export type MessageSystemMetadata = {
  finalQuery?: string;
};

export const roleEnum = pgEnum('role', ['user', 'assistant']);

export const messages = pgTable(
  'messages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text().notNull().references(() => conversations.id),
    role: roleEnum().notNull(),
    content: text().notNull(),
    metadata: jsonb().$type<MessageMetadata>(),
    systemMetadata: jsonb().$type<MessageSystemMetadata>(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_created_idx').on(table.conversationId, table.createdAt),
  ],
);
