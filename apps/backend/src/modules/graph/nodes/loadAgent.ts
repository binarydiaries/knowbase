import type { GraphNode } from '@langchain/langgraph';
import { db } from '../../../db';
import { ConfigSchema } from '../config';
import type { State } from '../state';

export const loadAgent: GraphNode<typeof State> = async (state, config) => {
  if (state.behaviour?.id) {
    return {};
  }

  const { agentId, orgId } = ConfigSchema.parse(config.configurable);

  if (!agentId || !orgId) {
    throw new Error(
      'loadAgent: agentId and orgId are required in config.configurable',
    );
  }

  // Verify the agent belongs to the requesting org — orgId lives on the
  // agents table, not on behaviors/intents, so we validate here first.
  const agent = await db.query.agents.findFirst({
    where: { id: agentId, orgId, agentStatus: 'active' },
  });

  if (!agent) {
    throw new Error(`Agent ${agentId} not found or inactive`);
  }

  const behaviour = await db.query.behaviors.findFirst({
    where: { agentId },
  });

  if (!behaviour) {
    throw new Error(`No behavior found for agent ${agentId}`);
  }

  const intents = await db.query.intents.findMany({
    where: { agentId },
    with: { actions: true },
  });

  return { behaviour, intents };
};
