import { MessagesValue, ReducedValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';
import { BehaviourSchema } from '../behaviour/model';
import { IntentActionSchema, IntentWithActionsSchema } from '../intent/model';
import { INTENT_QUESTION_ANSWERING } from './intents';

// Checkpoint round-trip: coerce date strings back to Date objects.
const GraphIntentActionSchema = IntentActionSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const GraphIntentWithActionsSchema = IntentWithActionsSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  actions: z.array(GraphIntentActionSchema),
});

export const RagChunkSchema = z.object({
  similarity: z.number(),
  content: z.string(),
  documentId: z.string(),
  documentVersion: z.number(),
  chunkIndex: z.number(),
});

// Checkpoint round-trip: dates are serialised to ISO strings by PostgresSaver.
// Use coerce.date() so restored state validates correctly.
const GraphBehaviourSchema = BehaviourSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const entitiesChannel = new ReducedValue(
  z.record(z.string(), z.unknown()).default({}),
  {
    inputSchema: z.record(z.string(), z.unknown()),
    reducer: (current, next) => ({ ...current, ...next }),
  },
);

export const InputState = new StateSchema({
  messages: MessagesValue,
  entities: entitiesChannel,
});

export const State = new StateSchema({
  behaviour: GraphBehaviourSchema,
  messages: MessagesValue,
  intents: z.array(GraphIntentWithActionsSchema).default([]),
  entities: entitiesChannel,
  intent: z.string().default(INTENT_QUESTION_ANSWERING),
  activeIntent: GraphIntentWithActionsSchema.optional(),
  finalQuery: z.string().optional(),
  ragChunks: z.array(RagChunkSchema).default([]),
  missingFields: z.array(z.string()).default([]),
  optionalMissingFields: z.array(z.string()).default([]),
  askedOptionalFields: z.boolean().default(false),
});

export const OutputState = new StateSchema({
  messages: MessagesValue,
});
