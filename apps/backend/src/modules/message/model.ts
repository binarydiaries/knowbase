import { Elysia } from 'elysia';
import { z } from 'zod';

const MessageRole = z.enum(['user', 'assistant']);

const MessageSource = z.object({
  documentId: z.string(),
  documentVersion: z.number(),
  chunkIndex: z.number(),
  similarity: z.number(),
});

export const MessageMetaData = z.object({
  confidenceScore: z.number().nullable(),
  sources: z.array(MessageSource).nullable().optional(),
  sentiment: z
    .object({
      label: z.enum(['positive', 'neutral', 'negative']),
      score: z.number(),
    })
    .nullable()
    .optional(),
});

export const MessageSystemMetaData = z.object({
  finalQuery: z.string().optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRole,
  content: z.string(),
  metadata: MessageMetaData.nullable(),
  systemMetadata: MessageSystemMetaData.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ManyMessageResponse = z.object({
  messages: z.array(MessageSchema),
});

export const MessageModel = new Elysia().model({
  MessageSchema,
  ManyMessageResponse,
});
