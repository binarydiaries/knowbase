import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { documentsRelations } from './schema';

// biome-ignore lint/style/noNonNullAssertion: will fix later
export const db = drizzle(process.env.DATABASE_URL!, {
  relations: documentsRelations,
  schema,
});
