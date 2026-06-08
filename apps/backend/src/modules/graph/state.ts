import { MessagesValue, ReducedValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';
import { BehaviourSchema } from '../behaviour/model';
import {
  WorkflowActionSchema,
  WorkflowWithActionsSchema,
} from '../workflow/model';
import { INTENT_QUESTION_ANSWERING } from './intents';

// Checkpoint round-trip: coerce date strings back to Date objects.
const GraphWorkflowActionSchema = WorkflowActionSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const GraphWorkflowWithActionsSchema = WorkflowWithActionsSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  actions: z.array(GraphWorkflowActionSchema),
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

export const InputState = new StateSchema({
  messages: MessagesValue,
});

export const State = new StateSchema({
  behaviour: GraphBehaviourSchema,
  messages: MessagesValue,
  workflows: z.array(GraphWorkflowWithActionsSchema).default([]),
  entities: new ReducedValue(z.record(z.string(), z.unknown()).default({}), {
    inputSchema: z.record(z.string(), z.unknown()),
    reducer: (current, next) => ({ ...current, ...next }),
  }),
  intent: z.string().default(INTENT_QUESTION_ANSWERING),
  activeWorkflow: GraphWorkflowWithActionsSchema.optional(),
  finalQuery: z.string().optional(),
  ragChunks: z.array(RagChunkSchema).default([]),
  missingFields: z.array(z.string()).default([]),
});

export const OutputState = new StateSchema({
  messages: MessagesValue,
});
