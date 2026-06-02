import type { RunnableConfig } from '@langchain/core/runnables';
import { similaritySearch } from '../../rag/retrieval.js';
import { getLastUserMessage } from '../state.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

export async function vectorSearch(state: AgentState, config: RunnableConfig): Promise<AgentStateUpdate> {
  const agentId = config.configurable?.agentId as string;
  const query = state.finalQuery ?? getLastUserMessage(state);

  if (!query || !agentId) return { ragChunks: [] };

  const chunks = await similaritySearch(query, agentId);
  return { ragChunks: chunks };
}
