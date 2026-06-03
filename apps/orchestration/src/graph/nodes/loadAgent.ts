import type { GraphNode } from '@langchain/langgraph';
import { db } from '../../db/index.js';
import type { State } from '../state.js';

export const loadAgent: GraphNode<typeof State> = async (_, config) => {
  const agentId = config.configurable?.agentId as string;

  if (!agentId) {
    throw new Error('loadAgent: agentId is required in config.configurable');
  }
  const behavior = await db.query.behaviors.findFirst({
    where: { agentId },
  });

  if (!behavior) {
    throw new Error(`No behavior found for agent ${agentId}`);
  }

  return {
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
    agentConfig: {
      systemPrompt: behavior.systemPrompt,
      tone: behavior.tone,
      verbosity: behavior.verbosity,
      fallbackMessage: behavior.fallbackMessage,
      guardrails: behavior.guardrails,
    },
  };
};
