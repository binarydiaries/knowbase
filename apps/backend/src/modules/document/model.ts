import { Elysia } from 'elysia';
import { z } from 'zod';

export const DocumentContentQna = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  }),
);

export const DocumentContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), data: z.unknown() }),
  z.object({ type: z.literal('qna'), data: DocumentContentQna }),
]);

export const Document = z.object({
  id: z.string(),
  title: z.string(),
  content: DocumentContent,
  chatbotId: z.string(),
  createdBy: z.string(),
  orgId: z.string(),
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
  document: Document,
});

const ManyDocumentsResponse = z.object({
  documents: z.array(Document),
});

export const ChatbotDocumentsParams = z.object({
  chatbotId: z.string(),
});

export const OneDocumentParams = z.object({
  id: z.string(),
});

export const DocumentModel = new Elysia().model({
  Document,
  CreateDocumentBody,
  UpdateDocumentBody,
  OneDocumentResponse,
  ManyDocumentsResponse,
  OneDocumentParams,
  ChatbotDocumentsParams,
});
