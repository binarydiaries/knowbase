// Imports used only by the commented-out implementation below — kept for
// easy re-enable when the workflow subgraph is wired in.
// import { HumanMessage, SystemMessage } from '@langchain/core/messages';
// import { z } from 'zod';
// import { createNanoLlm } from '../../integrations/llm.js';
// import { getLastUserMessage } from '../../utils/messages.js';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

const GENERAL_CHAT = 'general_chat' as const;

// ── Commented-out implementation — re-enable with workflow subgraph ───────────
//
// const llm = createNanoLlm();
//
// function buildIntentCall(workflows: { name: string; intentName: string }[]) {
  // z.enum requires a non-empty tuple — always include general_chat as the fallback
//   const intentValues = [
//     ...workflows.map((w) => w.intentName),
//     GENERAL_CHAT,
//   ] as [string, ...string[]];
//   const schema = z.object({ intent: z.enum(intentValues), confidence: z.enum(['high','medium','low']), reasoning: z.string() });
//   const intentList = workflows.map((w) => `- ${w.intentName}: ${w.name}`).join('\n');
//   const systemPrompt = `...`;
//   const structuredLlm = llm.withStructuredOutput(schema, { name: 'detect_intent', strict: true });
//   return { structuredLlm, systemPrompt };
// }

export const detectIntent: GraphNode<typeof State> = async (_state) => {
  // Hardcoded until the workflow subgraph is implemented.
  // Full implementation: uncomment the code above, then:
  //   if (!workflows.length) return { intent: GENERAL_CHAT };
  //   const userContent = getLastUserMessage(state);
  //   const { structuredLlm, systemPrompt } = buildIntentCall(workflows);
  //   const { intent, confidence } = await structuredLlm.invoke([new SystemMessage(systemPrompt), new HumanMessage(userContent)]);
  //   return { intent: confidence === 'low' ? GENERAL_CHAT : intent };
  return { intent: GENERAL_CHAT };
};
