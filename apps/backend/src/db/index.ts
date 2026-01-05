import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// biome-ignore lint/style/noNonNullAssertion: will fix later
export const db = drizzle(process.env.DATABASE_URL!, { schema });
