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

export const ChatbotRestrictedResponse = z.union([
  ChatbotLimitReachedResponse,
  ChatbotLockedResponse,
]);

export const ErrorModel = new Elysia().model({
  NotFoundResponse,
  ChatbotLimitReachedResponse,
  ChatbotLockedResponse,
  ChatbotRestrictedResponse,
});
