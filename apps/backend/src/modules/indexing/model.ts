import { Elysia } from 'elysia';
import { z } from 'zod';

const IndexingStartBody = z.object({
  chatbotId: z.string(),
});

const IndexingStartResponse = z.object({
  message: z.string(),
});

export const IndexingModel = new Elysia().model({
  IndexingStartBody,
  IndexingStartResponse,
});
