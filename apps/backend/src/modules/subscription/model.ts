import { Elysia } from 'elysia';
import { z } from 'zod';

export const PlanNameSchema = z.enum(['free', 'starter', 'growth', 'pro']);

export const SubscriptionStatusSchema = z.object({
  plan: PlanNameSchema,
  activeChatbotLimit: z.number(),
  activeChatbotCount: z.number(),
  isOverLimit: z.boolean(),
});

export const SubscriptionModel = new Elysia().model({
  PlanNameSchema,
  SubscriptionStatusSchema,
});
