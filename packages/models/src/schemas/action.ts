import { z } from 'zod';

const LeadFieldConfigSchema = z.object({
  collect: z.boolean(),
  required: z.boolean(),
});

export const LeadGenerationConfigSchema = z.object({
  fields: z
    .object({
      name: LeadFieldConfigSchema.optional(),
      email: LeadFieldConfigSchema.optional(),
      phone: LeadFieldConfigSchema.optional(),
      company: LeadFieldConfigSchema.optional(),
    })
    .optional(),
  triggerInstructions: z.string().max(300).optional(),
  successMessage: z.string().max(200).optional(),
});

export const AgentActionSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  actionType: z.enum(['lead_generation']),
  enabled: z.boolean(),
  config: LeadGenerationConfigSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
