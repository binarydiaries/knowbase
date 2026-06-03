import type { ConditionalEdgeRouter } from '@langchain/langgraph';
import type { State } from './state.js';

export const intentRouter: ConditionalEdgeRouter<
  typeof State,
  'general_chat' | 'workflow'
> = () => {
  return;
};
