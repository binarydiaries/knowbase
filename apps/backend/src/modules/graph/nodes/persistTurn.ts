import type { GraphNode } from '@langchain/langgraph';
import { ConversationService } from '../../conversation/service';
import { MessageService } from '../../message/service';
import { OrgUsageMonthlyService } from '../../subscription/usage';
import type { State } from '../state';
import { getLastAssistantMessage, getLastUserMessage } from '../utils/messages';
import { computeConfidenceScore } from '../utils/retrieval';
import { scoreSentiment } from '../utils/scoring';

export const persistTurn: GraphNode<typeof State> = async (state, config) => {
  const { thread_id, orgId, agentId, channelId, isPaid } =
    config?.configurable ?? {};

  if (!thread_id || !orgId || !agentId || !channelId) return {};

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

  const sentiment =
    isPaid && assistantText
      ? await scoreSentiment(assistantText, config)
      : null;

  await Promise.all([
    OrgUsageMonthlyService.incrementAssistantMessages(orgId),

    ConversationService.update(
      { id: thread_id, orgId, agentId, channelId },
      {
        lastAssistantUtterance: assistantText,
      },
    ),

    MessageService.addMessages([
      {
        conversationId: thread_id,
        role: 'user',
        content: userText,
        metadata: null,
        systemMetadata: state.finalQuery
          ? { finalQuery: state.finalQuery }
          : null,
      },
    ]).then(() =>
      MessageService.addMessages([
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
    ),
  ]);

  // Clear per-turn RAG state so stale chunks/query don't bleed into the next turn
  return { ragChunks: [], finalQuery: undefined };
};
