import { AIMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const executeAction: GraphNode<typeof State> = () => {
  return {
    messages: new AIMessage('Lead Saved'),
  };
};
