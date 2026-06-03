import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { createNanoLlm } from '../../integrations/llm.js';
import { getLastUserMessage } from '../../utils/messages.js';
import type { State } from '../state.js';

const GENERAL_CHAT = 'general_chat' as const;

const llm = createNanoLlm();

/**
 * Builds a typed schema + system prompt from the agent's workflow intents.
 * Co-located so the enum and prompt always stay in sync.
 */
function buildIntentCall(workflows: { name: string; intentName: string }[]) {
  // z.enum requires a non-empty tuple — always include general_chat as the fallback
  const intentValues = [
    ...workflows.map((w) => w.intentName),
    GENERAL_CHAT,
  ] as [string, ...string[]];

  const schema = z.object({
    intent: z
      .enum(intentValues)
      .describe('The single best-matching intent for the user message'),
    confidence: z
      .enum(['high', 'medium', 'low'])
      .describe('How confident you are in the match'),
    reasoning: z
      .string()
      .describe('One sentence explaining why this intent was chosen'),
  });

  const intentList = workflows
    .map((w) => `- ${w.intentName}: ${w.name}`)
    .join('\n');

  const systemPrompt = `You are an intent classifier for a conversational AI agent.

Available intents:
${intentList}
- ${GENERAL_CHAT}: General conversation, FAQs, or anything that doesn't clearly match the above

Rules:
- Pick the single most relevant intent
- Prefer '${GENERAL_CHAT}' when confidence is low rather than forcing a poor match
- Never invent an intent outside the list above`;

  const structuredLlm = llm.withStructuredOutput(schema, {
    name: 'detect_intent',
    strict: true,
  });

  return { structuredLlm, systemPrompt };
}

export const detectIntent: GraphNode<typeof State> = async (state) => {
  // const { workflows } = state;
  //
  // // No workflows configured — skip LLM call entirely
  // if (!workflows.length) {
  //   return { intent: GENERAL_CHAT };
  // }
  //
  // const userContent = getLastUserMessage(state);
  // const { structuredLlm, systemPrompt } = buildIntentCall(workflows);
  //
  // const { intent, confidence } = await structuredLlm.invoke([
  //   new SystemMessage(systemPrompt),
  //   new HumanMessage(userContent),
  // ]);
  //
  // // Low-confidence matches degrade to general_chat even if the enum was valid
  // const resolvedIntent = confidence === 'low' ? GENERAL_CHAT : intent;
  //
  // return { intent: resolvedIntent };
  return {
    // TODO: For testing only
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
    intent: 'general_chat',
  };
};
