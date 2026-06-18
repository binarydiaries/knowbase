import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';
import { createStreamingNanoLlm } from '../utils/llm';

export const collectMissingData: GraphNode<typeof State> = async (state, config) => {
  const { missingFields, optionalMissingFields, askedOptionalFields, entities, behaviour } = state;

  const systemPrompt = behaviour
    ? `${behaviour.systemPrompt}\nResponse tone: ${behaviour.tone}\nResponse verbosity: ${behaviour.verbosity}`
    : 'You are a helpful assistant.';

  const userName = entities?.name as string | undefined;
  const nameCtx = userName ? `The user's name is ${userName}. Address them by name naturally.` : '';

  // Phase 1: collect required fields (batch when more than one)
  if (missingFields.length > 0) {
    const fieldList = missingFields.join(', ');
    const userPrompt = missingFields.length === 1
      ? `Ask naturally for the following in one friendly sentence: ${fieldList}. ${nameCtx}`
      : `Ask naturally for ALL of the following in one friendly message (2 sentences max): ${fieldList}. ${nameCtx} Batch them together — do not ask one at a time.`;

    const result = await createStreamingNanoLlm(config, 'collectMissingData').invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    return { messages: [result] };
  }

  // Phase 2: ask for optional fields once (soft ask, never blocks execution)
  if (optionalMissingFields.length > 0 && !askedOptionalFields) {
    const fieldList = optionalMissingFields.join(' and ');
    const userPrompt = `Ask softly for the following optional information in one sentence. Make it clear it is optional and the user can skip it. ${nameCtx} Fields: ${fieldList}`;

    const result = await createStreamingNanoLlm(config, 'collectMissingData').invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    return { messages: [result], askedOptionalFields: true };
  }

  return {};
};
