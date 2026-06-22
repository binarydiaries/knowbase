import type { GraphNode } from '@langchain/langgraph';
import { logger } from '../../../utils/logger.utils';
import type { State } from '../state';

const log = logger.child({ module: 'graph', node: 'checkRequirements' });

export const checkRequirements: GraphNode<typeof State> = (state) => {
  const { activeIntent, entities } = state;

  if (!activeIntent) {
    return { missingFields: [], optionalMissingFields: [] };
  }

  const missing = activeIntent.requiredFields.filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === '';
  });

  const optionalMissing = (activeIntent.optionalFields ?? []).filter(
    (field) => {
      const value = entities[field];
      return value === undefined || value === null || value === '';
    },
  );

  log.debug(
    {
      intent: activeIntent.name,
      entities,
      required: activeIntent.requiredFields,
      missing,
      optionalMissing,
    },
    'requirements checked',
  );
  return { missingFields: missing, optionalMissingFields: optionalMissing };
};
