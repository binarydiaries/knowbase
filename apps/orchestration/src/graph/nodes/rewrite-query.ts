import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { createNanoLlm } from '../../integrations/llm.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

const llm = createNanoLlm();

/** Patterns that suggest a data-entry reply — skip reference resolution for these */
const DATA_ENTRY_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /^\+?[\d\s\-().]{7,15}$/, // phone
  /^(?:my )?name(?:\s+is)?\s*[:\-]?\s*.+$/i, // name prefix
];

function looksLikeDataEntry(message: string): boolean {
  const clean = message.trim();
  if (clean.endsWith('?') || clean.length > 80) return false;
  return DATA_ENTRY_PATTERNS.some((re) => re.test(clean));
}

export async function rewriteQuery(state: AgentState): Promise<AgentStateUpdate> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';

  // Find the last assistant message for reference resolution
  const priorMessages = state.messages.slice(0, -1);
  const lastAssistant = [...priorMessages]
    .reverse()
    .find((m) => m instanceof AIMessage || m.getType() === 'ai');
  const lastAssistantContent = lastAssistant
    ? (typeof lastAssistant.content === 'string' ? lastAssistant.content : '')
    : '';

  // Skip reference resolution for data-entry responses
  if (!lastAssistantContent || looksLikeDataEntry(userContent)) {
    return { finalQuery: userContent };
  }

  // Check if the message has any pronouns that need resolving
  const referenceWords = /\b(that|it|they|this|those|these|there|its|their)\b/i;
  if (!referenceWords.test(userContent)) {
    return { finalQuery: userContent };
  }

  try {
    const result = await llm.invoke([
      new HumanMessage(`Rewrite the user message ONLY if it contains unclear references (e.g. "that", "it", "they") that depend on the previous assistant message.

Rules:
- Use ONLY the previous assistant message to resolve references
- Do NOT add, infer, or assume any information
- Do NOT rephrase or improve the question
- Do NOT answer the question
- If no reference is present, return the user message EXACTLY as-is
- Output ONLY the final rewritten message. No explanations.

Previous assistant message:
"""
${lastAssistantContent}
"""

User message:
"""
${userContent}
"""`),
    ]);

    const rewritten = typeof result.content === 'string' ? result.content.trim() : userContent;
    return { finalQuery: rewritten || userContent };
  } catch {
    return { finalQuery: userContent };
  }
}
