import type { GraphNode } from '@langchain/langgraph';
import { ConversationService } from '../../conversation/service';
import { MessageService } from '../../message/service';
import type { State } from '../state';
import { computeConfidenceScore } from '../utils/retrieval';
import { scoreSentiment } from '../utils/scoring';
import { getLastAssistantMessage, getLastUserMessage } from '../utils/messages';

export const persistTurn: GraphNode<typeof State> = async (state, config) => {
  const { thread_id } = config?.configurable ?? {};

  if (!thread_id) return {};

  const userText = getLastUserMessage(state);
  const assistantText = getLastAssistantMessage(state);

  const confidenceScore = computeConfidenceScore(state.ragChunks);

  const sources = state.ragChunks.length
    ? state.ragChunks.map((chunk) => ({
        documentId: chunk.documentId,
        documentVersion: chunk.documentVersion,
        chunkIndex: chunk.chunkIndex,
        similarity: chunk.similarity,
      }))
    : null;

  const sentiment = assistantText ? await scoreSentiment(assistantText) : null;

  await Promise.all([
    ConversationService.update(thread_id, {
      lastAssistantUtterance: assistantText,
    }),

    MessageService.addMessages([
      {
        conversationId: thread_id,
        role: 'user',
        content: userText,
        metadata: null,
        systemMetadata: state.finalQuery ? { finalQuery: state.finalQuery } : null,
      },
      {
        conversationId: thread_id,
        role: 'assistant',
        content: assistantText,
        metadata: {
          confidenceScore,
          sources,
          sentiment,
        },
        systemMetadata: null,
      },
    ]),
  ]);

  // Clear per-turn RAG state so stale chunks/query don't bleed into the next turn
  return { ragChunks: [], finalQuery: undefined };
};
