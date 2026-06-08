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
  // agents table, not on behaviors/workflows, so we validate here first.
  const agent = await db.query.agents.findFirst({
    where: { id: agentId, orgId },
  });

  if (!agent) {
    throw new Error(
      `Agent ${agentId} not found or does not belong to this organisation`,
    );
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
