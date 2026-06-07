import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const checkRequirements: GraphNode<typeof State> = (state) => {
  const { activeWorkflow, entities } = state;

  if (!activeWorkflow) {
    return { missingFields: [] };
  }

  const missing = activeWorkflow.requiredFields.filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === '';
  });

  return { missingFields: missing };
};
