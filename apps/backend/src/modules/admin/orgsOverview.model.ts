import { Elysia } from 'elysia';
import { z } from 'zod';

const AdminOrgsOverviewRowSchema = z.object({
  orgId: z.string(),
  orgName: z.string().nullable(),
  agentCount: z.number(),
  conversationCount: z.number(),
  messageCount: z.number(),
  lastActiveAt: z.string().nullable(),
  currentMonthMessages: z.number(),
});

export const AdminOrgsOverviewResponseSchema = z.object({
  data: z.array(AdminOrgsOverviewRowSchema),
  meta: z.object({
    orgCount: z.number(),
    agentCount: z.number(),
    conversationCount: z.number(),
    messageCount: z.number(),
    monthKey: z.string(),
  }),
});

export const AdminOrgsOverviewModel = new Elysia().model({
  AdminOrgsOverviewResponseSchema,
});
