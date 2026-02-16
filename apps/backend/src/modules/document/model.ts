import { Elysia } from 'elysia';
import { z } from 'zod';

const DocumentStatus = z.enum([
  'draft',
  'ready',
  'queue',
  'indexing',
  'indexed',
  'failed',
]);

export const DocumentContentQna = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  }),
);

const DocumentContentText = z.string();

export const DocumentContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), data: DocumentContentText }).meta({
    title: 'text',
  }),
  z.object({ type: z.literal('qna'), data: DocumentContentQna }).meta({
    title: 'qna',
  }),
]);

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: DocumentContent,
  status: DocumentStatus,
  chatbotId: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateDocumentBody = z.object({
  chatbotId: z.string(),
  title: z.string(),
  content: DocumentContent,
});

const UpdateDocumentBody = z.object({
  title: z.string().optional(),
  content: DocumentContent,
});

const OneDocumentResponse = z.object({
  document: DocumentSchema,
});

const ManyDocumentsResponse = z.object({
  documents: z.array(DocumentSchema),
});

export const ChatbotDocumentsParams = z.object({
  chatbotId: z.string(),
});

export const OneDocumentParams = z.object({
  id: z.string(),
});

export const DocumentModel = new Elysia().model({
  DocumentSchema,
  CreateDocumentBody,
  UpdateDocumentBody,
  OneDocumentResponse,
  ManyDocumentsResponse,
  OneDocumentParams,
  ChatbotDocumentsParams,
  DocumentContentQna,
  DocumentContentText,
});
