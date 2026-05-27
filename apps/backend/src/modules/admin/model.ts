import { Elysia } from 'elysia';
import { z } from 'zod';

export const AdminCostByOrganizationQuerySchema = z.object({
  startMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  endMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

const AdminCostByOrganizationRowSchema = z.object({
  orgId: z.string(),
  orgName: z.string().nullable(),
  requestCount: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedInputTokens: z.number(),
  totalTokens: z.number(),
  costUsd: z.number(),
});

export const AdminCostByOrganizationResponseSchema = z.object({
  data: z.array(AdminCostByOrganizationRowSchema),
  meta: z.object({
    startMonth: z.string(),
    endMonth: z.string(),
    totalRequestCount: z.number(),
    totalInputTokens: z.number(),
    totalOutputTokens: z.number(),
    totalCachedInputTokens: z.number(),
    totalTokens: z.number(),
    totalCostUsd: z.number(),
  }),
});

export const AdminCostsModel = new Elysia().model({
  AdminCostByOrganizationQuerySchema,
  AdminCostByOrganizationResponseSchema,
});
