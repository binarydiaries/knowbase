import { Elysia } from 'elysia';
import { z } from 'zod';

export const Model = new Elysia().model({
  ChatBody: z.object({
    conversationId: z.string(),
    message: z.string(),
    channelId: z.string(),
  }),
});
