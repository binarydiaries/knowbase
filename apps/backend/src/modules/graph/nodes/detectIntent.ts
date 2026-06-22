import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { State } from '../state';
import { createNanoLlm } from '../utils/llm';
import { getLastAssistantMessage, getLastUserMessage } from '../utils/messages';

export { INTENT_QUESTION_ANSWERING };

export const detectIntent: GraphNode<typeof State> = async (state, config) => {
  const { intents, activeIntent, missingFields, optionalMissingFields, askedOptionalFields } = state;

  if (!intents || intents.length === 0) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

  const userContent = getLastUserMessage(state);

  if (!userContent) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

  const intentList = [
    INTENT_QUESTION_ANSWERING,
    ...intents.map((w) => w.name),
  ] as [string, ...string[]];

  const IntentSchema = z.object({
    intent: z
      .enum(intentList)
      .describe(
        `The intent of the user's message. "${INTENT_QUESTION_ANSWERING}" means the user wants an informational answer. Other values represent specific business workflows (e.g. lead capture, booking).`,
      ),
  });

  const structuredLlm = createNanoLlm(config, 'detectIntent').withStructuredOutput(
    IntentSchema,
    { name: 'detect_intent' },
  );

  // Build intent descriptions for the system prompt.
  // triggerInstructions provides the human context for each intent,
  // giving the classifier real signal beyond just the slug name.
  const intentDescriptions = intents
    .map((w) => {
      const instructions = w.triggerInstructions?.trim();
      return `- "${w.name}": ${instructions || w.name}`;
    })
    .join('\n');

  let systemPrompt = `You are an intent classifier. Classify the user's message into exactly one of the following intents:

- "${INTENT_QUESTION_ANSWERING}": user is asking a general question and needs an informational answer
${intentDescriptions}`;

  // If an intent is in progress, give the model the context it needs to
  // decide whether the user is answering the intent question or going off-topic.
  if (activeIntent && missingFields && missingFields.length > 0) {
    const nextField = missingFields[0];
    systemPrompt += `

The assistant is currently collecting information for the "${activeIntent.name}" intent.
The last question asked the user for their "${nextField}".

If the user's message looks like an answer to that question (e.g. providing a name, email, or other personal detail), classify it as "${activeIntent.name}".
If the user is clearly asking a general question unrelated to providing that information, classify it as "${INTENT_QUESTION_ANSWERING}".`;
  } else if (activeIntent && askedOptionalFields && optionalMissingFields && optionalMissingFields.length > 0) {
    const fields = optionalMissingFields.join(', ');
    systemPrompt += `

The assistant is currently collecting information for the "${activeIntent.name}" intent.
The last question asked the user for optional information: ${fields}.

If the user's message provides that information or declines to share it, classify it as "${activeIntent.name}".
If the user is clearly asking a general question, classify it as "${INTENT_QUESTION_ANSWERING}".`;
  }

  // Include the previous assistant message when classifying mid-intent turns.
  // "Arokart" alone is ambiguous; "Arokart" after "Can you share your company
  // name?" is clearly providing the value. The LLM needs that context to
  // distinguish a value/skip from an off-topic Q&A question.
  const lastBotMessage = (activeIntent && (missingFields?.length || askedOptionalFields))
    ? getLastAssistantMessage(state)
    : null;

  const classifyMessages = lastBotMessage
    ? [new SystemMessage(systemPrompt), new AIMessage(lastBotMessage), new HumanMessage(userContent)]
    : [new SystemMessage(systemPrompt), new HumanMessage(userContent)];

  const { intent } = await structuredLlm.invoke(classifyMessages);

  console.log('[DEBUG detectIntent] input=%s activeIntent=%s missingFields=%s → intent=%s', userContent.slice(0, 80), activeIntent?.name ?? 'none', JSON.stringify(missingFields), intent);
  return { intent };
};
