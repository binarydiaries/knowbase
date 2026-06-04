import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL);
