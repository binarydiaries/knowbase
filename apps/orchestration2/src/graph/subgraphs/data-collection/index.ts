import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createNanoLlm } from '../../../integrations/llm.js';
import type { AgentState, AgentStateUpdate } from '../../state.js';

const llm = createNanoLlm();

/**
 * Asks naturally for the next missing required field.
 * Generates a single response asking for ONE missing field at a time.
 * The graph suspends after this and awaits the next user message.
 */
export async function collectMissingData(state: AgentState): Promise<AgentStateUpdate> {
  const { missingFields, agentConfig } = state;

  const nextField = missingFields[0];
  if (!nextField) return {};

  const systemPrompt = agentConfig
    ? `${agentConfig.systemPrompt}\nResponse tone: ${agentConfig.tone}\nResponse verbosity: ${agentConfig.verbosity}`
    : 'You are a helpful assistant.';

  try {
    const result = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Ask naturally for the following information in a friendly way, in one sentence: ${nextField}`),
    ]);

    const response = typeof result.content === 'string' ? result.content : `Could you share your ${nextField}?`;
    return { response };
  } catch {
    return { response: `Could you share your ${nextField}?` };
  }
}
