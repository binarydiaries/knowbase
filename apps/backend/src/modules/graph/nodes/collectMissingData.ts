import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';
import { createStreamingNanoLlm } from '../utils/llm';

/**
 * Asks naturally for the next missing required field.
 * Generates a single response asking for ONE missing field at a time.
 * The graph suspends after this and awaits the next user message.
 */
export const collectMissingData: GraphNode<typeof State> = async (state, config) => {
  const { missingFields, behaviour } = state;

  const nextField = missingFields[0];
  if (!nextField) return {};

  const systemPrompt = behaviour
    ? `${behaviour.systemPrompt}\nResponse tone: ${behaviour.tone}\nResponse verbosity: ${behaviour.verbosity}`
    : 'You are a helpful assistant.';

  // Streaming so the question reaches the client token-by-token via streamMode:'messages'.
  const result = await createStreamingNanoLlm(config, 'collectMissingData').invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(
      `Ask naturally for the following information in a friendly way, in one sentence: ${nextField}`,
    ),
  ]);

  return { messages: [result] };
};
