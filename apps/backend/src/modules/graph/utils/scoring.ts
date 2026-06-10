import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { createNanoLlm } from './llm';

const SentimentSchema = z.object({
  label: z.enum(['positive', 'neutral', 'negative']),
  score: z.number().min(0).max(1),
});

const structuredLlm = createNanoLlm().withStructuredOutput(SentimentSchema, {
  name: 'score_sentiment',
  strict: true,
});

/**
 * Scores the sentiment of an assistant message.
 * Returns null on any failure so it never breaks the conversation.
 */
export async function scoreSentiment(assistantText: string): Promise<z.infer<typeof SentimentSchema> | null> {
  try {
    return await structuredLlm.invoke([
      new SystemMessage(
        'Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1.',
      ),
      new HumanMessage(`"${assistantText}"`),
    ]);
  } catch {
    return null;
  }
}
