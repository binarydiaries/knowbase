import { Elysia } from 'elysia';
import { z } from 'zod';

const MessageRole = z.enum(['user', 'assistant']);

const messageSource = z.object({
  documentId: z.string(),
  documentVersion: z.number(),
  chunkIndex: z.number(),
  similarity: z.number(),
});

export const MessageMetaData = z.object({
  confidenceScore: z.number().optional(),
  sources: z.array(messageSource).optional(),
});

export const MessageSystemMetaData = z.object({
  finalQuery: z.string().optional(),
});

export const Message = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRole,
  content: z.string(),
  metadata: MessageMetaData,
  systemMetadata: MessageSystemMetaData,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MessageModel = new Elysia().model({
  GetMessageQuery: z.object({
    conversationId: z.string(),
  }),
});
