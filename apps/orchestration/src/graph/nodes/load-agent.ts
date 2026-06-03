import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

export const loadAgent: GraphNode<typeof State> = async (_, config) => {
  const agentId = config.configurable?.agentId as string;

  if (!agentId) {
    throw new Error('loadAgent: agentId is required in config.configurable');
  }
  return {};
};
