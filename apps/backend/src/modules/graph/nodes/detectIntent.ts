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
  const { workflows, activeWorkflow, missingFields } = state;

  if (!workflows || workflows.length === 0) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

  const userContent = getLastUserMessage(state);

  if (!userContent) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

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

  // Build the base system prompt
  let systemPrompt = `You are an intent classifier. Classify the user's message into exactly one of the following intents:

${intentList.join('\n')}

- "${INTENT_QUESTION_ANSWERING}" means the user is asking a general question and needs an informational answer.
- Other intents represent specific business workflows (e.g. lead capture, booking).`;

  // If a workflow is in progress, give the model the context it needs to
  // decide whether the user is answering the workflow question or going off-topic.
  if (activeWorkflow && missingFields && missingFields.length > 0) {
    const nextField = missingFields[0];
    systemPrompt += `

The assistant is currently collecting information for the "${activeWorkflow.intentName}" workflow.
The last question asked the user for their "${nextField}".

If the user's message looks like an answer to that question (e.g. providing a name, email, or other personal detail), classify it as "${activeWorkflow.intentName}".
If the user is clearly asking a general question unrelated to providing that information, classify it as "${INTENT_QUESTION_ANSWERING}".`;
  }

  const { intent } = await structuredLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userContent),
  ]);

  return { intent };
};
