import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state';
import { createNanoLlm } from '../utils/llm';

const llm = createNanoLlm();
export const INTENT_QUESTION_ANSWERING = 'question_answering';

export const detectIntent: GraphNode<typeof State> = async (state) => {
  const { workflows } = state;

  // No workflows configured — always route to RAG
  if (!workflows || workflows.length === 0) {
    return { intent: INTENT_QUESTION_ANSWERING };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  const userContent =
    typeof lastMessage?.content === 'string' ? lastMessage.content : '';

  const intentList = [
    INTENT_QUESTION_ANSWERING,
    ...workflows.map((w) => w.intentName),
  ];

  const systemPrompt = `You are an intent classifier. Classify the user's message into exactly one of the following intents:

${intentList.join('\n')}

Rules:
- "${INTENT_QUESTION_ANSWERING}" means the user is asking a general question and needs an informational answer
- Other intents represent specific business workflows (e.g., lead capture, booking)
- Return ONLY a JSON object: {"intent": "<intent_name>"}
- No explanation, no markdown, just the JSON`;

  try {
    const result = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ]);

    const text =
      typeof result.content === 'string' ? result.content.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { intent: INTENT_QUESTION_ANSWERING };

    const parsed = JSON.parse(jsonMatch[0]) as { intent?: string };
    const intent = intentList.includes(parsed.intent ?? '')
      ? (parsed.intent ?? INTENT_QUESTION_ANSWERING)
      : INTENT_QUESTION_ANSWERING;

    return { intent };
  } catch {
    return { intent: INTENT_QUESTION_ANSWERING };
  }
};
