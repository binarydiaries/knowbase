import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import type { State } from '../state.js';
import { createNanoLlm } from '../utils/llm';
import { getLastUserMessage } from '../utils/messages';

const ExtractEntityResponseSchema = z.object({
  entities: z
    .array(
      z.object({
        key: z
          .string()
          .describe('Entity name, e.g. name, email, phone, orderId'),
        value: z.string().describe('Extracted value'),
      }),
    )
    .describe('List of entities extracted from the message'),
});

const llm = createNanoLlm();
const structuredLlm = llm.withStructuredOutput(ExtractEntityResponseSchema, {
  name: 'extract_entities',
  strict: true,
});

const SYSTEM_PROMPT = `You are an entity extractor. Extract structured information from the user's message.
- Return a list of {key, value} pairs for every entity clearly stated
- Use concise snake_case keys: name, email, phone, company, order_id, date, etc.
- Only include values explicitly stated — never infer
- Return an empty list if nothing to extract`;

/** True when at least one workflow has a save_lead action (entity capture required). */
function needsEntityExtraction(state: typeof State.State): boolean {
  // return state.workflows.some((w) =>
  //   w.actions.some((a) => a.actionType === 'save_lead'),
  // );
  return true;
}

// /** Pure questions and very short messages can't contain named entities. */
// function canContainEntities(message: string): boolean {
//   const clean = message.trim();
//   if (!clean || clean.endsWith('?') || clean.split(/\s+/).length < 3)
//     return false;
//   return true;
// }

export const extractEntities: GraphNode<typeof State> = async (state) => {
  const userContent = getLastUserMessage(state);

  if (
    !userContent ||
    !needsEntityExtraction(state)
    // !canContainEntities(userContent)
  ) {
    return { entities: {} };
  }

  const { entities } = await structuredLlm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userContent),
  ]);

  const entityMap = Object.fromEntries(
    entities.map(({ key, value }) => [key, value]),
  );

  return { entities: entityMap };
};
