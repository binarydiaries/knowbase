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

const BASE_SYSTEM_PROMPT = `You are an entity extractor. Extract structured information from the user's message.
- Return a list of {key, value} pairs for every entity clearly stated
- Use concise snake_case keys: name, email, phone, company, order_id, date, etc.
- Only include values explicitly stated — never infer
- Return an empty list if nothing to extract`;

/** True when at least one intent collects fields (required or optional). */
function needsEntityExtraction(state: typeof State.State): boolean {
  return state.intents.some(
    (w) => w.requiredFields.length > 0 || (w.optionalFields?.length ?? 0) > 0,
  );
}

/**
 * Build a context-aware system prompt so the extractor knows which fields are
 * expected. Without this, an opaque value like "Arokart" after the bot asked
 * "what's your company name?" would not be labelled as `company`.
 */
function buildSystemPrompt(state: typeof State.State): string {
  const { activeIntent, missingFields, optionalMissingFields, askedOptionalFields } = state;

  if (activeIntent && missingFields && missingFields.length > 0) {
    return `${BASE_SYSTEM_PROMPT}\n\nContext: The assistant just asked the user for: ${missingFields.join(', ')}. The user's reply is likely providing these values — label them with the matching keys.`;
  }

  if (activeIntent && askedOptionalFields && optionalMissingFields && optionalMissingFields.length > 0) {
    return `${BASE_SYSTEM_PROMPT}\n\nContext: The assistant just asked the user if they'd like to share optional information: ${optionalMissingFields.join(', ')}. If the user's reply provides any of these values or clearly answers with a value for one of them, extract it using the matching key.`;
  }

  return BASE_SYSTEM_PROMPT;
}

export const extractEntities: GraphNode<typeof State> = async (state, config) => {
  const userContent = getLastUserMessage(state);

  if (!userContent || !needsEntityExtraction(state)) {
    return { entities: {} };
  }

  const structuredLlm = createNanoLlm(config, 'extractEntities').withStructuredOutput(
    ExtractEntityResponseSchema,
    { name: 'extract_entities', strict: true },
  );

  const { entities } = await structuredLlm.invoke([
    new SystemMessage(buildSystemPrompt(state)),
    new HumanMessage(userContent),
  ]);

  const entityMap = Object.fromEntries(
    entities.map(({ key, value }) => [key, value]),
  );

  return { entities: entityMap };
};
