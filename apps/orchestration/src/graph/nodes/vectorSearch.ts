import type { GraphNode } from '@langchain/langgraph';
import { similaritySearch } from '../../rag/retrieval.js';
import { getLastUserMessage } from '../../utils/messages.js';
import { ConfigSchema, type State } from '../state.js';

export const vectorSearch: GraphNode<typeof State> = async (state, config) => {
  const { agentId } = ConfigSchema.parse(config.configurable);
  const query = state.finalQuery ?? getLastUserMessage(state);

  if (!query || !agentId) return { ragChunks: [] };

  const chunks = await similaritySearch(query, agentId);
  return { ragChunks: chunks };
};
