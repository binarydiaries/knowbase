import type { GraphNode } from '@langchain/langgraph';
import { db } from '../../db/index.js';
import type { State } from '../state.js';

export const loadAgent: GraphNode<typeof State> = async (_, config) => {
  const agentId = config.configurable?.agentId as string;

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
    with: {
      actions: true,
    },
  });

  return {
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
    behaviour,
    workflows,
  };
};
