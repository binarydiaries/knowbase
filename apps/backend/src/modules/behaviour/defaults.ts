import type { behaviors } from '../../db/schema/behaviors';

type IBehaviourInsert = typeof behaviors.$inferInsert;
export const DEFAULT_BEHAVIOR: Omit<
  IBehaviourInsert,
  'chatbotId' | 'createdBy'
> = {
  systemPrompt:
    'You are a helpful support assistant. Answer using the provided sources only.',
  tone: 'neutral',
  verbosity: 'balanced',
  fallbackMessage:
    "I don't know the answer to that based on the information I have.",
};
