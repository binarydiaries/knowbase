import { index, integer, pgTable, text, vector } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../utils/columns.js';
import { documents } from './documents.js';

export const embeddings = pgTable(
  'embeddings',
  {
    id: cuid2PrimaryKey,
    documentId: text()
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    documentVersion: integer().notNull(),
    chunkIndex: integer().notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
);
