import { index, pgTable, text, vector } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { documents } from './documents';

export const embeddings = pgTable(
  'embeddings',
  {
    id: cuid2PrimaryKey,
    documentId: text().references(() => documents.id, { onDelete: 'cascade' }),
    content: text().notNull(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);
