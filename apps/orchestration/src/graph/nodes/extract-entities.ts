import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createNanoLlm } from '../../integrations/llm.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

const llm = createNanoLlm();

const SYSTEM_PROMPT = `You are an entity extractor. Your job is to extract structured information from a user's message.

Extract only factual values the user explicitly provides. Common entities include:
- name (person's name)
- email (email address)
- phone (phone number)
- company (company or organization name)
- Any other identifiable data the user mentions

Rules:
- Return a JSON object with the extracted entities
- Only include entities that are clearly present in the message
- Do NOT infer or assume values
- Return {} if nothing to extract
- Never include the word "null" as a value — omit the key instead

Respond with ONLY the JSON object, no explanation.`;

export async function extractEntities(state: AgentState): Promise<AgentStateUpdate> {
  const lastMessage = state.messages[state.messages.length - 1];
  if (!lastMessage) return {};

  const userContent = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : '';

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
