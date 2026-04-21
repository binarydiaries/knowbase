import { Elysia } from 'elysia';
import { z } from 'zod';

export const LeadSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  conversationId: z.string().nullable(),
  channelId: z.string().nullable(),
  orgId: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  customFields: z.record(z.string(), z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const LeadWithRelationsSchema = LeadSchema.extend({
  agent: z.object({ id: z.string(), name: z.string() }).nullable(),
  channel: z.object({ id: z.string(), type: z.string() }).nullable(),
  conversation: z.object({ id: z.string() }).nullable(),
});

const GetLeadsQuery = z.object({
  agentId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const LeadModel = new Elysia().model({
  LeadSchema,
  GetLeadsQuery,
  ManyLeadsResponse: z.object({
    leads: z.array(LeadWithRelationsSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
});
