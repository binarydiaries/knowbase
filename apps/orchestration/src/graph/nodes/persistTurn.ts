import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

export const persistTurn: GraphNode<typeof State> = async () => {
  return {
    // TODO: For testing only
    // messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
  };
};
