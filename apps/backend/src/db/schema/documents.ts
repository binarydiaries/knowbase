import { pgTable, text } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';

export const documents = pgTable('documents', {
  id: cuid2PrimaryKey,
  content: text().notNull(),
  ...timestamps,
});
