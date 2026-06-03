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
