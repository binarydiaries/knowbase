import { Elysia } from 'elysia';
import { z } from 'zod';

export const PlanNameSchema = z.enum(['free', 'starter', 'growth', 'pro']);

export const SubscriptionStatusSchema = z.object({
  plan: PlanNameSchema,
  subscriptionStatus: z.string().nullable(),
  scheduledPlan: z.string().nullable(),
  scheduledPlanAt: z.string().nullable(), // ISO date string
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
  scheduledFor: z.string().nullable(), // ISO date when new plan starts, null = starts immediately
});

export const CancelResponseSchema = z.object({
  success: z.boolean(),
});

export const ResumeResponseSchema = z.object({
  success: z.boolean(),
});

export const CancelScheduledChangeResponseSchema = z.object({
  success: z.boolean(),
});

export const SubscriptionModel = new Elysia().model({
  PlanNameSchema,
  SubscriptionStatusSchema,
  CheckoutBodySchema,
  CheckoutResponseSchema,
  CancelResponseSchema,
  ResumeResponseSchema,
  CancelScheduledChangeResponseSchema,
});
