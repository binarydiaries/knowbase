import type { GraphNode } from '@langchain/langgraph';
import { db } from '../../db/index.js';
import { ConfigSchema, type State } from '../state.js';

export const loadAgent: GraphNode<typeof State> = async (state, config) => {
  // On subsequent turns the checkpointer restores behaviour and workflows from
  // the previous checkpoint — skip the DB round-trips if they're already present.
  if (state.behaviour?.id && state.workflows) {
    return {};
  }

  const { agentId } = ConfigSchema.parse(config.configurable);

  if (!agentId) {
    throw new Error('loadAgent: agentId is required in config.configurable');
  }

  const behaviour = await db.query.behaviors.findFirst({
    where: { agentId },
  });

  if (!behaviour) {
    throw new Error(`No behavior found for agent ${agentId}`);
  }

  const workflows = await db.query.workflows.findMany({
    where: { agentId },
    with: { actions: true },
  });

  return { behaviour, workflows };
};
