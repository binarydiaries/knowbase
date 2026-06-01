import { similaritySearch } from '../../rag/retrieval.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

export async function vectorSearch(state: AgentState): Promise<AgentStateUpdate> {
  const query = state.finalQuery ?? state.userMessage;
  if (!query) return { ragChunks: [] };

  const chunks = await similaritySearch(query, state.agentId);
  return { ragChunks: chunks };
}
