import Elysia from 'elysia';
import { z } from 'zod';
import { PLAN_LIMITS } from '../../modules/subscription/service';

export const NotFoundResponse = z.object({
  code: z.enum(['NOT_FOUND']),
  message: z.string(),
});

const PlanName = z.enum(Object.keys(PLAN_LIMITS) as [keyof typeof PLAN_LIMITS]);

export const ChatbotLimitReachedResponse = z.object({
  code: z.enum(['CHATBOT_LIMIT_REACHED']),
  message: z.string(),
  plan: PlanName,
  limit: z.number(),
  current: z.number(),
});

export const ErrorModel = new Elysia().model({
  NotFoundResponse,
  ChatbotLimitReachedResponse,
});
