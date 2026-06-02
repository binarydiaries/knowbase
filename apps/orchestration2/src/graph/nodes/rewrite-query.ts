import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createNanoLlm } from '../../integrations/llm.js';
import { getLastUserMessage } from '../state.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

const llm = createNanoLlm();

const DATA_ENTRY_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /^\+?[\d\s\-().]{7,15}$/,                           // phone
  /^(?:my )?name(?:\s+is)?\s*[:\-]?\s*.+$/i,          // name prefix
];

function looksLikeDataEntry(message: string): boolean {
  const clean = message.trim();
  if (clean.endsWith('?') || clean.length > 80) return false;
  return DATA_ENTRY_PATTERNS.some((re) => re.test(clean));
}

export async function rewriteQuery(state: AgentState): Promise<AgentStateUpdate> {
  const userContent = getLastUserMessage(state);

  // Find the last assistant message for reference resolution
  const lastAssistant = [...state.messages]
    .reverse()
    .find((m) => m instanceof AIMessage || m.getType() === 'ai');
  const lastAssistantContent =
    typeof lastAssistant?.content === 'string' ? lastAssistant.content : '';

  // Skip if no prior assistant turn, or message is a data-entry response
  if (!lastAssistantContent || looksLikeDataEntry(userContent)) {
    return { finalQuery: userContent };
  }

  // Skip if no pronouns/references to resolve
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
