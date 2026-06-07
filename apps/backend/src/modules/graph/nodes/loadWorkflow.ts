import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const loadWorkflow: GraphNode<typeof State> = (state) => {
  const { intent, workflows } = state;

  const workflow = workflows.find((w) => w.intentName === intent);
  return { activeWorkflow: workflow };
};
