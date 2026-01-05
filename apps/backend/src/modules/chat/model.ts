import { Elysia } from 'elysia';
import { z } from 'zod';

export const Model = new Elysia().model({
  ChatBody: z.object({
    id: z.string(),
    message: z.object({
      id: z.string(),
      text: z.string(),
    }),
  }),
});
