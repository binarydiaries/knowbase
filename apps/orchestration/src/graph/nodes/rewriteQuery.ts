import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

export const rewriteQuery: GraphNode<typeof State> = async (state) => {
  return {
    // TODO: For testing only
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
    intent: 'general_chat',
  };
};
