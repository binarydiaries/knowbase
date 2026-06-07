import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { State } from '../state';
import { createNanoLlm } from '../utils/llm';
import { getLastUserMessage } from '../utils/messages';

export { INTENT_QUESTION_ANSWERING };

const llm = createNanoLlm();

export const detectIntent: GraphNode<typeof State> = async (state) => {
  const { workflows } = state;

  if (!workflows || workflows.length === 0) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

  const userContent = getLastUserMessage(state);

  const intentList = [
    INTENT_QUESTION_ANSWERING,
    ...workflows.map((w) => w.intentName),
  ] as [string, ...string[]];

  const IntentSchema = z.object({
    intent: z
      .enum(intentList)
      .describe(
        `The intent of the user's message. "${INTENT_QUESTION_ANSWERING}" means the user wants an informational answer. Other values represent specific business workflows (e.g. lead capture, booking).`,
      ),
  });

  const structuredLlm = llm.withStructuredOutput(IntentSchema, {
    name: 'detect_intent',
  });

  const systemPrompt = `You are an intent classifier. Classify the user's message into exactly one of the following intents:

${intentList.join('\n')}

- "${INTENT_QUESTION_ANSWERING}" means the user is asking a general question and needs an informational answer.
- Other intents represent specific business workflows (e.g. lead capture, booking).`;

  const { intent } = await structuredLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userContent),
  ]);

  return { intent };
};
