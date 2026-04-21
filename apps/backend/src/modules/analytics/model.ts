import Elysia from 'elysia';
import { z } from 'zod';

// Overview (all-time, no date filter)
const AnalyticsOverviewResponseSchema = z.object({
  totalConversations: z.number(),
  totalMessages: z.number(),
  avgMessagesPerConv: z.number(),
  avgConfidenceScore: z.string().nullable(),
});

// Conversations daily
const ConversationsDailyQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

const ConversationsDailyResponseSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    }),
  ),
});

// Messages by channel
const MessagesByChannelQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

const MessagesByChannelResponseSchema = z.object({
  data: z.array(
    z.object({
      channelType: z.string(),
      count: z.number(),
    }),
  ),
});

// Top agents
const TopAgentsQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const TopAgentsResponseSchema = z.object({
  data: z.array(
    z.object({
      agentId: z.string(),
      agentName: z.string(),
      conversations: z.number(),
      messages: z.number(),
      avgConfidence: z.string().nullable(),
    }),
  ),
});

// Sentiment breakdown
const SentimentQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

const SentimentResponseSchema = z.object({
  data: z.array(
    z.object({
      label: z.string(),
      count: z.number(),
    }),
  ),
});

// Top topics
const TopTopicsQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

const TopTopicsResponseSchema = z.object({
  data: z.array(
    z.object({
      topic: z.string(),
      count: z.number(),
    }),
  ),
});

// Country distribution
const CountryDistributionQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  agentId: z.string().optional(),
});

const CountryDistributionResponseSchema = z.object({
  data: z.array(
    z.object({
      country: z.string(),
      count: z.number(),
    }),
  ),
});

export const AnalyticsModel = new Elysia().model({
  AnalyticsOverviewResponseSchema,
  ConversationsDailyQuerySchema,
  ConversationsDailyResponseSchema,
  MessagesByChannelQuerySchema,
  MessagesByChannelResponseSchema,
  TopAgentsQuerySchema,
  TopAgentsResponseSchema,
  SentimentQuerySchema,
  SentimentResponseSchema,
  TopTopicsQuerySchema,
  TopTopicsResponseSchema,
  CountryDistributionQuerySchema,
  CountryDistributionResponseSchema,
});
