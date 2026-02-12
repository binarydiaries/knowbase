import { defineRelations } from 'drizzle-orm';
import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const documents = pgTable('documents', {
  id: cuid2PrimaryKey,
  title: text().notNull(),
  contentSerialized: jsonb().notNull(),
  version: integer().notNull().default(1),
  type: text().$type<'text' | 'qna'>().notNull(),
  status: text()
    .$type<'draft' | 'ready' | 'indexing' | 'indexed' | 'failed'>()
    .notNull()
    .default('draft'),
  lastIndexedVersion: integer(),
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  createdBy: clerkUserId,
  ...timestamps,
});

export const documentsRelations = defineRelations(
  { documents, chatbots },
  (r) => ({
    documents: {
      chatbot: r.one.chatbots({
        from: r.documents.chatbotId,
        to: r.chatbots.id,
      }),
    },
  }),
);

// export const documentsRelations = relations(documents, ({ one }) => ({
//   chatbot: one(chatbots, {
//     fields: [documents.chatbotId],
//     references: [chatbots.id],
//   }),
// }));
