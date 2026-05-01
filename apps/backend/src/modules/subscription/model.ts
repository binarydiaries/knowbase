import { Elysia } from 'elysia';
import { z } from 'zod';

export const PlanNameSchema = z.enum(['free', 'starter', 'growth', 'pro']);

export const SubscriptionStatusSchema = z.object({
  plan: PlanNameSchema,
  subscriptionStatus: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  activeAgentLimit: z.number(),
  activeAgentCount: z.number(),
  knowledgeSourceLimit: z.number(),
  knowledgeSourceCount: z.number(),
  messagesPerMonthLimit: z.number(),
  messagesThisMonth: z.number(),
  trainingRunsPerDayLimit: z.number(),
  trainingRunsToday: z.number(),
  isOverLimit: z.boolean(),
  hasReachedKnowledgeSourceLimit: z.boolean(),
  hasReachedMessagesPerMonthLimit: z.boolean(),
  hasReachedTrainingRunsPerDayLimit: z.boolean(),
});

export const CheckoutBodySchema = z.object({
  plan: z.enum(['starter', 'growth', 'pro']),
});

export const CheckoutResponseSchema = z.object({
  provider: z.string(),
  subscriptionId: z.string(),
  clientToken: z.string(),
});

export const PlanLimitsSchema = z.object({
  agents: z.number(),
  knowledgeSources: z.number(),
  messagesPerMonth: z.number(),
  trainingRunsPerDay: z.number(),
});

export const PlanItemSchema = z.object({
  slug: PlanNameSchema,
  name: z.string(),
  priceMonthlyPaise: z.number(),
  priceDisplay: z.string(),
  period: z.string(),
  highlight: z.boolean(),
  features: z.array(z.string()),
  limits: PlanLimitsSchema,
});

export const PlansResponseSchema = z.object({
  plans: z.array(PlanItemSchema),
});

export const CancelBodySchema = z.object({
  immediate: z.boolean().default(false),
});

export const CancelResponseSchema = z.object({
  success: z.boolean(),
});

export const SubscriptionModel = new Elysia().model({
  PlanNameSchema,
  SubscriptionStatusSchema,
  PlanItemSchema,
  PlansResponseSchema,
  CheckoutBodySchema,
  CheckoutResponseSchema,
  CancelBodySchema,
  CancelResponseSchema,
});
