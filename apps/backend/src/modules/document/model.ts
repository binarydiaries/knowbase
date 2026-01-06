import { Elysia } from 'elysia';
import { z } from 'zod';

const Document = z.object({
  id: z.string(),
  content: z.string(),
  chatbotId: z.string(),
  createdBy: z.string(),
  orgId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateDocumentBody = z.object({
  content: z.string(),
  chatbotId: z.string(),
});

const UpdateDocumentBody = z.object({
  content: z.string(),
});

const OneDocumentResponse = z.object({
  document: Document,
});

const ManyDocumentsResponse = z.object({
  documents: z.array(Document),
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
});
