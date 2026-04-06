import { Elysia } from 'elysia';
import { z } from 'zod';

const DailyPoint = z.object({
  date: z.string(),
  count: z.number(),
});

const ChatbotCount = z.object({
  chatbotId: z.string(),
  chatbotName: z.string(),
  count: z.number(),
});

export const MessagesDailyQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  chatbotId: z.string().optional(),
});

export const MessagesDailyResponseSchema = z.object({
  data: z.array(DailyPoint),
});

export const MessagesByChatbotQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  chatbotId: z.string().optional(),
});

export const MessagesByChatbotResponseSchema = z.object({
  data: z.array(ChatbotCount),
});

export const KnowledgeByChatbotQuerySchema = z.object({
  chatbotId: z.string().optional(),
});

export const KnowledgeByChatbotResponseSchema = z.object({
  data: z.array(ChatbotCount),
});

export const UsageChartsModel = new Elysia().model({
  MessagesDailyQuerySchema,
  MessagesDailyResponseSchema,
  MessagesByChatbotQuerySchema,
  MessagesByChatbotResponseSchema,
  KnowledgeByChatbotQuerySchema,
  KnowledgeByChatbotResponseSchema,
});
