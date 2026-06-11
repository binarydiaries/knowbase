import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { createNanoLlm } from './llm';

const SentimentSchema = z.object({
  label: z.enum(['positive', 'neutral', 'negative']),
  score: z.number().min(0).max(1),
});

/**
 * Scores the sentiment of an assistant message.
 * Returns null on any failure so it never breaks the conversation.
 *
 * Pass `config` (from the graph node) to record token usage automatically.
 */
export async function scoreSentiment(
  assistantText: string,
  config?: RunnableConfig | null,
): Promise<z.infer<typeof SentimentSchema> | null> {
  try {
    const structuredLlm = createNanoLlm(config, 'scoreSentiment').withStructuredOutput(
      SentimentSchema,
      { name: 'score_sentiment', strict: true },
    );

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
