import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './schema/relations';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing database url');
}

export const db = drizzle(databaseUrl, {
  relations,
});
