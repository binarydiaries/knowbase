import type { GraphNode } from '@langchain/langgraph';
import { tracer } from '../../../utils/tracer';
import type { State } from '../state';

export const checkRequirements: GraphNode<typeof State> = (state) =>
  tracer.startActiveSpan('graph.checkRequirements', (span) => {
    const { activeIntent, entities } = state;

    if (!activeIntent) {
      span.setAttribute('graph.activeIntent', 'none');
      span.end();
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

    span.setAttributes({
      'graph.activeIntent': activeIntent.name,
      'graph.missingFields': JSON.stringify(missing),
      'graph.optionalMissingFields': JSON.stringify(optionalMissing),
    });
    console.log(
      '[DEBUG checkRequirements] intent=%s entities=%s required=%s → missing=%s optionalMissing=%s',
      activeIntent.name,
      JSON.stringify(entities),
      JSON.stringify(activeIntent.requiredFields),
      JSON.stringify(missing),
      JSON.stringify(optionalMissing),
    );
    span.end();
    return { missingFields: missing, optionalMissingFields: optionalMissing };
  });
