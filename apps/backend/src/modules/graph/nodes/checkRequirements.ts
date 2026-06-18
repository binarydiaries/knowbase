import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';

export const checkRequirements: GraphNode<typeof State> = (state) => {
  const { activeIntent, entities } = state;

  if (!activeIntent) {
    return { missingFields: [], optionalMissingFields: [] };
  }

  const missing = activeIntent.requiredFields.filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === '';
  });

  const optionalMissing = (activeIntent.optionalFields ?? []).filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === '';
  });

  return { missingFields: missing, optionalMissingFields: optionalMissing };
};
