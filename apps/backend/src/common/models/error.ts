import Elysia from 'elysia';
import { z } from 'zod';

export const NotFoundResponse = z.object({
  code: z.enum(['NOT_FOUND']),
  message: z.string(),
});

export const ErrorModel = new Elysia().model({
  NotFoundResponse,
});
