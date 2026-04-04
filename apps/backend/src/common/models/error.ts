import Elysia from 'elysia';
import { z } from 'zod';
import { PlanNameSchema } from '../../modules/subscription/model';

export const NotFoundResponse = z.object({
  code: z.enum(['NOT_FOUND']),
  message: z.string(),
});

export const ChatbotLimitReachedResponse = z.object({
  code: z.enum(['CHATBOT_LIMIT_REACHED']),
  message: z.string(),
  plan: PlanNameSchema,
  activeChatbotLimit: z.number(),
  activeChatbotCount: z.number(),
});

export const ChatbotLockedResponse = z.object({
  code: z.enum(['CHATBOT_LOCKED']),
  message: z.string(),
  plan: PlanNameSchema,
  activeChatbotLimit: z.number(),
  activeChatbotCount: z.number(),
});

export const KnowledgeSourceLimitReachedResponse = z.object({
  code: z.enum(['KNOWLEDGE_SOURCE_LIMIT_REACHED']),
  message: z.string(),
  plan: PlanNameSchema,
  knowledgeSourceLimit: z.number(),
  knowledgeSourceCount: z.number(),
});

export const TrainingLimitReachedResponse = z.object({
  code: z.enum(['TRAINING_LIMIT_REACHED']),
  message: z.string(),
  plan: PlanNameSchema,
  trainingRunsPerDayLimit: z.number(),
  trainingRunsToday: z.number(),
});

export const MessageLimitReachedResponse = z.object({
  code: z.enum(['MESSAGE_LIMIT_REACHED']),
  message: z.string(),
  plan: PlanNameSchema,
  messagesPerMonthLimit: z.number(),
  messagesThisMonth: z.number(),
});

export const KnowledgeSourceTextTooLargeResponse = z.object({
  code: z.enum(['KNOWLEDGE_SOURCE_TEXT_TOO_LARGE']),
  message: z.string(),
  maxCharacters: z.number(),
});

export const KnowledgeSourceQnaTooLargeResponse = z.object({
  code: z.enum(['KNOWLEDGE_SOURCE_QNA_TOO_LARGE']),
  message: z.string(),
  maxCharacters: z.number(),
});

export const KnowledgeSourceQnaTooManyPairsResponse = z.object({
  code: z.enum(['KNOWLEDGE_SOURCE_QNA_TOO_MANY_PAIRS']),
  message: z.string(),
  maxPairs: z.number(),
});

export const ChatbotRestrictedResponse = z.union([
  ChatbotLimitReachedResponse,
  ChatbotLockedResponse,
]);

export const DocumentWriteForbiddenResponse = z.union([
  ChatbotLockedResponse,
  KnowledgeSourceLimitReachedResponse,
]);

export const IndexingForbiddenResponse = z.union([
  ChatbotLockedResponse,
  TrainingLimitReachedResponse,
]);

export const ChatForbiddenResponse = MessageLimitReachedResponse;

export const ErrorModel = new Elysia().model({
  NotFoundResponse,
  ChatbotLimitReachedResponse,
  ChatbotLockedResponse,
  ChatbotRestrictedResponse,
  KnowledgeSourceLimitReachedResponse,
  TrainingLimitReachedResponse,
  MessageLimitReachedResponse,
  KnowledgeSourceTextTooLargeResponse,
  KnowledgeSourceQnaTooLargeResponse,
  KnowledgeSourceQnaTooManyPairsResponse,
  DocumentWriteForbiddenResponse,
  IndexingForbiddenResponse,
  ChatForbiddenResponse,
});
