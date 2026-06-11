import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const loadIntent: GraphNode<typeof State> = (state) => {
  const { intent, intents } = state;

  const activeIntent = intents.find((w) => w.name === intent);
  return { activeIntent };
};
