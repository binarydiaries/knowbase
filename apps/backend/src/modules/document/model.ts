import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { DocumentWriteForbiddenResponse } from '../../common/models/error';

const TEXT_SOURCE_MAX_CHARACTERS = 10_000;
const QNA_SOURCE_MAX_CHARACTERS = 20_000;
const QNA_SOURCE_MAX_PAIRS = 50;

const DocumentStatus = z.enum([
  'ready',
  'queue',
  'indexing',
  'indexed',
  'failed',
]);

export const DocumentContentQna = z
  .array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  )
  .max(QNA_SOURCE_MAX_PAIRS, {
    message: `Q&A sources can contain up to ${QNA_SOURCE_MAX_PAIRS} question-answer pairs.`,
  })
  .superRefine((qaList, ctx) => {
    const totalCharacters = qaList.reduce(
      (total, qa) => total + qa.question.length + qa.answer.length,
      0,
    );

    if (totalCharacters > QNA_SOURCE_MAX_CHARACTERS) {
      ctx.addIssue({
        code: 'custom',
        message: `Q&A sources can contain up to ${QNA_SOURCE_MAX_CHARACTERS} characters across all questions and answers.`,
      });
    }
  });

const DocumentContentText = z.string().max(TEXT_SOURCE_MAX_CHARACTERS, {
  message: `Text sources can contain up to ${TEXT_SOURCE_MAX_CHARACTERS} characters.`,
});

const DocumentContentPdf = z.string();

const DocumentContentUrl = z.object({
  url: z.string().url(),
  rawText: z.string(),
  crawledAt: z.string().datetime(),
});

export const DocumentContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), data: DocumentContentText }).meta({
    title: 'text',
  }),
  z.object({ type: z.literal('qna'), data: DocumentContentQna }).meta({
    title: 'qna',
  }),
  z.object({ type: z.literal('pdf'), data: DocumentContentPdf }).meta({
    title: 'pdf',
  }),
  z.object({ type: z.literal('url'), data: DocumentContentUrl }).meta({
    title: 'url',
  }),
]);

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: DocumentContent,
  status: DocumentStatus,
  agentId: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastTrainedAt: z.date().nullable(),
});

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
  code: z.enum([
    'INVALID_URL',
    'FETCH_FAILED',
    'FETCH_TIMEOUT',
    'NOT_HTML',
    'PRIVATE_HOST',
    'DNS_FAILED',
    'PAGE_EMPTY',
  ]),
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
