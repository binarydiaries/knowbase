import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { createNanoLlm } from '../../integrations/llm.js';
import { getLastUserMessage } from '../../utils/messages.js';
import type { State } from '../state.js';

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

export const extractEntities: GraphNode<typeof State> = async (state) => {
  const userContent = getLastUserMessage(state);

  const { entities } = await structuredLlm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userContent),
  ]);

  const entityMap = Object.fromEntries(
    entities.map(({ key, value }) => [key, value]),
  );

  return {
    entities: entityMap,
  };
};
