import type { GraphNode } from '@langchain/langgraph';
import { db } from '../../../db';
import { ConfigSchema } from '../config';
import type { State } from '../state';

export const loadAgent: GraphNode<typeof State> = async (state, config) => {
  // if (state.behaviour?.id && state.workflows) {
  //   return {};
  // }

  console.log(config?.configurable?.thread_id, state.behaviour);
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

  // const workflows = await db.query.workflows.findMany({
  //   where: { agentId },
  //   with: { actions: true },
  // });

  return { behaviour };
};
