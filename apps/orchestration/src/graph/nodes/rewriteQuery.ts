import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { createNanoLlm } from '../../integrations/llm.js';
import {
  getLastAssistantMessage,
  getLastUserMessage,
} from '../../utils/messages.js';
import type { State } from '../state.js';

const llm = createNanoLlm();

const RewriteQuerySchema = z.object({
  finalQuery: z
    .string()
    .describe(
      'The user message with ambiguous pronouns or references resolved using ' +
        'the previous assistant message. If nothing needed resolving, return the ' +
        'original message verbatim.',
    ),
});

const structuredLlm = llm.withStructuredOutput(RewriteQuerySchema, {
  name: 'rewrite_query',
  strict: true,
});

const SYSTEM_PROMPT = `You are a query rewriter for a retrieval-augmented AI assistant.

Your only job is to resolve ambiguous references (e.g. "it", "that", "they", "this") in the user's message using the previous assistant message as context, so the rewritten query can be understood in isolation.

Rules:
- Resolve references ONLY using the previous assistant message — never infer beyond it
- Preserve the user's original wording and intent exactly
- Do NOT rephrase, improve, summarise, or answer the question
- If the message has no ambiguous references, return it EXACTLY as-is`;

const DATA_ENTRY_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /^\+?[\d\s\-().]{7,15}$/, // phone number
  /^(?:my )?name(?:\s+is)?\s*[:\-]?\s*.+$/i, // "my name is …"
];

function looksLikeDataEntry(message: string): boolean {
  const clean = message.trim();
  if (clean.endsWith('?') || clean.length > 80) return false;
  return DATA_ENTRY_PATTERNS.some((re) => re.test(clean));
}

const REFERENCE_WORDS = /\b(that|it|they|this|those|these|there|its|their)\b/i;

export const rewriteQuery: GraphNode<typeof State> = async (state) => {
  const userContent = getLastUserMessage(state);
  const lastAssistantContent = getLastAssistantMessage(state);

  // Skip: no prior assistant turn, data-entry response, or no references to resolve
  if (
    !lastAssistantContent ||
    looksLikeDataEntry(userContent) ||
    !REFERENCE_WORDS.test(userContent)
  ) {
    return {
      finalQuery: userContent,
    };
  }

  const { finalQuery } = await structuredLlm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(
      `<previous_assistant_message>\n${lastAssistantContent}\n</previous_assistant_message>\n\n` +
        `<user_message>\n${userContent}\n</user_message>`,
    ),
  ]);

  return {
    finalQuery,
  };
};
