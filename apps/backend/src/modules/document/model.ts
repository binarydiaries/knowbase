import { Elysia } from 'elysia';
import { z } from 'zod';

const Document = z.object({
  id: z.string(),
  title: z.string(),
  contentSerialized: z.unknown(),
  chatbotId: z.string(),
  createdBy: z.string(),
  orgId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  type: z.enum(['text', 'qna']),
});

const CreateDocumentBody = z.object({
  chatbotId: z.string(),
  title: z.string(),
  contentSerialized: z.unknown(),
  type: z.enum(['text', 'qna']),
});

const UpdateDocumentBody = z.object({
  title: z.string(),
  contentSerialized: z.unknown(),
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
