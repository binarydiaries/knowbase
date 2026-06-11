import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL,
);

// Create LangGraph checkpoint tables if they don't exist.
// Runs once at module import. If setup fails the server exits immediately
// rather than accepting requests that will all fail at the checkpoint layer.
checkpointer.setup().catch((err) => {
  console.error('[checkpointer] Failed to initialise checkpoint tables:', err);
  process.exit(1);
});
