import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

export const loadAgent: GraphNode<typeof State> = async () => {
  // TODO: load agent config + workflows from DB using config.configurable.agentId
  return {};
};
