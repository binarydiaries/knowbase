import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

export const extractEntities: GraphNode<typeof State> = async (_, config) => {
  return {
    // TODO: For testing only
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
  };
};
