import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { DocumentWriteForbiddenResponse } from '../../common/models/error';
import {
  DocumentContent,
  DocumentContentQna,
  DocumentContentText,
  DocumentSchema,
} from '@knowbase/models/schemas';

export { DocumentContent, DocumentContentQna, DocumentContentText, DocumentSchema };

const CreateDocumentBody = z.object({
  agentId: z.string(),
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

export const AgentDocumentsParams = z.object({
  agentId: z.string(),
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
  AgentDocumentsParams,
  DocumentContentQna,
  DocumentContentText,
});

const PdfPreviewResponse = z.object({
  markdown: z.string(),
  pages: z.number(),
  characters: z.number(),
  truncated: z.boolean(),
});

const SavePdfBody = z.object({
  agentId: z.string(),
  title: z.string().min(1),
  text: z.string().min(1),
});

const PdfUploadErrorResponse = z.object({
  code: z.enum(['INVALID_FILE', 'PDF_ENCRYPTED', 'PDF_EMPTY']),
  message: z.string(),
});

export const DocumentPdfModel = new Elysia().model({
  UploadPdfBody: t.Object({
    file: t.File({ maxSize: '50m' }),
    agentId: t.String(),
  }),
  SavePdfBody,
  PdfPreviewResponse,
  PdfUploadErrorResponse,
});

const UrlPreviewBody = z.object({
  agentId: z.string(),
  url: z.string().url(),
});

const UrlPreviewResponse = z.object({
  title: z.string(),
  charCount: z.number(),
  preview: z.string(),
  rawText: z.string(),
});

const SaveUrlBody = z.object({
  agentId: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  rawText: z.string().min(1),
});

const UrlErrorResponse = z.object({
  code: z.enum(['INVALID_URL', 'FETCH_FAILED', 'FETCH_TIMEOUT', 'NOT_HTML', 'PRIVATE_HOST', 'DNS_FAILED', 'PAGE_EMPTY']),
  message: z.string(),
});

const UrlCrawlingDisabledResponse = z.object({
  code: z.enum(['FORBIDDEN']),
  message: z.string(),
});

const DocumentUrlWriteForbiddenResponse = z.union([
  DocumentWriteForbiddenResponse,
  UrlCrawlingDisabledResponse,
]);

export const DocumentUrlModel = new Elysia().model({
  UrlPreviewBody,
  UrlPreviewResponse,
  SaveUrlBody,
  UrlErrorResponse,
  UrlCrawlingDisabledResponse,
  DocumentUrlWriteForbiddenResponse,
});
