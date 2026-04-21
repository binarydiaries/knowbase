import { Elysia } from 'elysia';
import { z } from 'zod';

const DailyPoint = z.object({
  date: z.string(),
  count: z.number(),
});

const AgentCount = z.object({
  agentId: z.string(),
  agentName: z.string(),
  count: z.number(),
});

export const MessagesDailyQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

export const MessagesDailyResponseSchema = z.object({
  data: z.array(DailyPoint),
});

export const MessagesByAgentQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

export const MessagesByAgentResponseSchema = z.object({
  data: z.array(AgentCount),
});

export const KnowledgeByAgentQuerySchema = z.object({
  agentId: z.string().optional(),
});

export const KnowledgeByAgentResponseSchema = z.object({
  data: z.array(AgentCount),
});

export const UsageChartsModel = new Elysia().model({
  MessagesDailyQuerySchema,
  MessagesDailyResponseSchema,
  MessagesByAgentQuerySchema,
  MessagesByAgentResponseSchema,
  KnowledgeByAgentQuerySchema,
  KnowledgeByAgentResponseSchema,
});
