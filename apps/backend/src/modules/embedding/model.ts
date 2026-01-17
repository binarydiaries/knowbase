import { Elysia } from 'elysia';
import { z } from 'zod';

const EmbedStartBody = z.object({
  chatbotId: z.string(),
});

const EmbedStartResponse = z.object({
  message: z.string(),
});

export const EmbeddingModel = new Elysia().model({
  EmbedStartBody,
  EmbedStartResponse,
});
