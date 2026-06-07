import { AIMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const executeActions: GraphNode<typeof State> = () => {
  return {
    messages: new AIMessage('Lead Saved'),
  };
};
