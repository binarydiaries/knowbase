import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';
import { BehaviourSchema } from '../behaviour/model';

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
  // entities: new ReducedValue(z.record(z.string(), z.unknown()).default({}), {
  //   inputSchema: z.record(z.string(), z.unknown()),
  //   reducer: (current, next) => ({ ...current, ...next }),
  // }),
  // intent: z.string().default('general_chat'),
  finalQuery: z.string().optional(),
  ragChunks: z.array(RagChunkSchema).default([]),
});

export const OutputState = new StateSchema({
  messages: MessagesValue,
});
