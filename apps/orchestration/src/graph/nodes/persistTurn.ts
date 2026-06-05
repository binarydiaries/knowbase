/**
 * persistTurn — the single owner of all post-turn DB writes.
 *
 * Responsibilities:
 *   1. Update conversation summary fields (lastUserQuestion, lastAssistantUtterance,
 *      lastMessageAt, entities)
 *   2. Insert user + assistant messages with full metadata
 *      (finalQuery, RAG sources, confidence score, sentiment)
 *
 * Sentiment scoring is gated on config.isPaid — only runs for paid orgs.
 *
 * The backend is responsible only for creating the bare conversation row the
 * first time (to satisfy the FK before this node runs). All subsequent writes
 * to the conversation and every message insert are owned here.
 */

import { conversations, db, messages } from '@knowbase/models/db';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode, LangGraphRunnableConfig } from '@langchain/langgraph';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createNanoLlm } from '../../integrations/llm.js';
import { computeConfidenceScore } from '../../rag/retrieval.js';
import {
  getLastAssistantMessage,
  getLastUserMessage,
} from '../../utils/messages.js';
import { ConfigSchema, type State } from '../state.js';

// ── Sentiment ─────────────────────────────────────────────────────────────────

const SentimentSchema = z.object({
  label: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Overall sentiment of the assistant response'),
  score: z.number().describe('Confidence score between 0 and 1'),
});

type Sentiment = z.infer<typeof SentimentSchema> | null;

const sentimentLlm = createNanoLlm().withStructuredOutput(SentimentSchema, {
  name: 'score_sentiment',
  strict: true,
});

async function scoreSentiment(assistantText: string): Promise<Sentiment> {
  try {
    return await sentimentLlm.invoke([
      new SystemMessage(
        'Classify the sentiment of the given AI assistant response. ' +
          'Return the label (positive, neutral, or negative) and a confidence score between 0 and 1.',
      ),
      new HumanMessage(assistantText),
    ]);
  } catch {
    return null;
  }
}

// ── Node ──────────────────────────────────────────────────────────────────────

export const persistTurn: GraphNode<typeof State> = async (state, config) => {
  const conversationId = (config as LangGraphRunnableConfig)?.configurable
    ?.thread_id as string | undefined;

  if (!conversationId) {
    throw new Error('persistTurn: thread_id must be set in configurable (it is the conversationId)');
  }

  const { isPaid } = ConfigSchema.parse(config.configurable);

  const userText = getLastUserMessage(state);
  const assistantText = getLastAssistantMessage(state);

  if (!userText || !assistantText) return {};

  const sentiment = isPaid ? await scoreSentiment(assistantText) : null;
  const confidenceScore = computeConfidenceScore(state.ragChunks);

  // Update conversation — backend only wrote the bare creation row
  await db
    .update(conversations)
    .set({
      lastUserQuestion: userText,
      lastAssistantUtterance: assistantText,
      lastMessageAt: new Date(),
      entities: state.entities as Record<string, string>,
    })
    .where(eq(conversations.id, conversationId));

  // Insert messages with full metadata
  await db.insert(messages).values([
    {
      conversationId,
      role: 'user' as const,
      content: userText,
      systemMetadata: { finalQuery: state.finalQuery ?? userText },
    },
    {
      conversationId,
      role: 'assistant' as const,
      content: assistantText,
      metadata: {
        confidenceScore,
        sources: state.ragChunks.map((c) => ({
          documentId: c.documentId,
          documentVersion: c.documentVersion,
          chunkIndex: c.chunkIndex,
          similarity: c.similarity,
        })),
        sentiment,
      },
    },
  ]);

  return {};
};
