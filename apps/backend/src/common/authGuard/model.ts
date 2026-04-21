import { Elysia } from 'elysia';
import { z } from 'zod';

const UnauthorizedSchema = z.object({
  code: z.literal('UNAUTHORIZED'),
  message: z.string(),
});

const ForbiddenSchema = z.object({
  code: z.literal('FORBIDDEN'),
  message: z.string(),
});

export const ClerkModel = new Elysia().model({
  UnauthorizedSchema,
  ForbiddenSchema,
});
