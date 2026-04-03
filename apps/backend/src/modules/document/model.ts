import { Elysia } from 'elysia';
import { z } from 'zod';

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
  lastTrainedAt: z.date().nullable(),
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
