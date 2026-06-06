import type { GraphNode } from '@langchain/langgraph';
import { ConfigSchema } from '../config';
import type { State } from '../state';
import { getLastUserMessage } from '../utils/messages';
import { similaritySearch } from '../utils/retrieval';

export const vectorSearch: GraphNode<typeof State> = async (state, config) => {
  const { agentId } = ConfigSchema.parse(config.configurable);
  const query = state.finalQuery ?? getLastUserMessage(state);

  if (!query || !agentId) return { ragChunks: [] };

  const chunks = await similaritySearch(query, agentId);
  return { ragChunks: chunks };
};
