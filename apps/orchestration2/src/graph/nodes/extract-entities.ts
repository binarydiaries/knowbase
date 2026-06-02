import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createNanoLlm } from '../../integrations/llm.js';
import { getLastUserMessage } from '../state.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

const llm = createNanoLlm();

const SYSTEM_PROMPT = `You are an entity extractor. Extract structured information from the user's message.

Common entities: name, email, phone, company, orderId, or any other data the user explicitly provides.

Rules:
- Return a JSON object with extracted entities only
- Only include values clearly stated in the message — never infer
- Omit keys with no value (do not use null)
- Return {} if nothing to extract

Respond with ONLY the JSON object, no explanation.`;

export async function extractEntities(state: AgentState): Promise<AgentStateUpdate> {
  const userContent = getLastUserMessage(state);
  if (!userContent) return {};

  try {
    const result = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userContent),
    ]);

    const text = typeof result.content === 'string' ? result.content.trim() : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const extracted = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return { entities: extracted };
  } catch {
    return {};
  }
}
