import { z } from 'zod';

export const MessageMetaData = z.object({
  confidenceScore: z.number().nullable(),
  sources: z
    .array(
      z.object({
        documentId: z.string(),
        documentVersion: z.number(),
        chunkIndex: z.number(),
        similarity: z.number(),
      }),
    )
    .nullable()
    .optional(),
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
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  metadata: MessageMetaData.nullable(),
  systemMetadata: MessageSystemMetaData.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
