import { Elysia } from 'elysia';
import { z } from 'zod';

const MessageRole = z.enum(['system', 'user', 'assistant']);

const MessageTextPart = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const Message = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRole,
  parts: z.array(MessageTextPart),
});

export type IMessage = z.infer<typeof Message>;

export const MessageModel = new Elysia().model({
  GetMessageQuery: z.object({
    conversationId: z.string(),
  }),
});
