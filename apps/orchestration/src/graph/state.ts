import { BehaviourSchema, WorkflowWithActionsSchema } from '@knowbase/models';
import { MessagesValue, ReducedValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

export const RagChunkSchema = z.object({
  similarity: z.number(),
  content: z.string(),
  documentId: z.string(),
  documentVersion: z.number(),
  chunkIndex: z.number(),
});

export const InputState = new StateSchema({
  messages: MessagesValue,
});

export const State = new StateSchema({
  behaviour: BehaviourSchema,
  messages: MessagesValue,
  // Loaded by loadAgent — defaults avoid undefined access before the node runs
  workflows: z.array(WorkflowWithActionsSchema).default([]),
  entities: new ReducedValue(z.record(z.string(), z.unknown()).default({}), {
    inputSchema: z.record(z.string(), z.unknown()),
    reducer: (current, next) => ({ ...current, ...next }),
  }),
  // z.string() (not enum) — intent names come from workflow.intentName which are dynamic
  intent: z.string().default('general_chat'),
  // Optional — rewriteQuery may be skipped; vectorSearch falls back to last user message
  finalQuery: z.string().optional(),
  // Default to empty — generateResponse guards on length
  ragChunks: z.array(RagChunkSchema).default([]),
});

export const OutputState = new StateSchema({
  messages: MessagesValue,
});
export const ConfigSchema = z.object({
  agentId: z.string().optional().describe('Agent ID from the dashboard'),
  orgId: z.string().optional().describe('Clerk organisation ID'),
  channelId: z.string().optional().describe('Channel ID the message came from'),
  ip: z
    .string()
    .optional()
    .describe('Client IP address (for geo enrichment, optional)'),
  isPaid: z.boolean().optional().describe('Whether the org is on a paid plan — gates sentiment scoring'),
});
