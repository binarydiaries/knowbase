import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';
import { createNanoLlm } from '../utils/llm';
import { getLastAssistantMessage, getLastUserMessage } from '../utils/messages';

const llm = createNanoLlm();

export const rewriteQuery: GraphNode<typeof State> = async (state) => {
  const userContent = getLastUserMessage(state);
  const lastAssistantContent = getLastAssistantMessage(state);
  if (!lastAssistantContent) {
    return {
      finalQuery: userContent,
    };
  }

  const result = await llm.invoke(
    `You are a reference resolver. Replace vague references in the user message with the specific thing they refer to, using only the previous assistant message.\n\nReferences to resolve: "it", "that", "this", "they", "them", "those", "one", "which one", "the one", "some", "these".\n\nRules:\n- Replace the vague word with the specific noun from the assistant message.\n- Keep all other words exactly as-is.\n- If there is nothing to replace, return the message exactly as-is.\n- Output ONLY the rewritten message. No explanations.\n\nExamples:\nAssistant: "We support web, WhatsApp, and Slack."\nUser: "Which one is easiest to set up?"\nOutput: "Which channel is easiest to set up?"\n\nAssistant: "Our Pro plan costs $99/month."\nUser: "Does it include WhatsApp?"\nOutput: "Does the Pro plan include WhatsApp?"\n\nAssistant: "You can upload PDFs, Word docs, and URLs."\nUser: "How long does it take to process them?"\nOutput: "How long does it take to process PDFs, Word docs, and URLs?"\n\n---\n\nPrevious assistant message:\n"""\n${lastAssistantContent}\n"""\n\nUser message:\n"""\n${userContent}\n"""\n\nOutput:`,
  );

  const finalQuery =
    typeof result.content === 'string' && result.content.trim()
      ? result.content.trim()
      : userContent;

  return { finalQuery };
};
