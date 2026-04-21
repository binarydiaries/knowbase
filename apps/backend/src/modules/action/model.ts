import { Elysia } from 'elysia';
import { z } from 'zod';

const LeadFieldConfigSchema = z.object({
  collect: z.boolean(),
  required: z.boolean(),
});

const LeadGenerationConfigSchema = z.object({
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

export const CreateAgentActionBody = z.object({
  agentId: z.string(),
  actionType: z.enum(['lead_generation']),
  config: LeadGenerationConfigSchema.optional().default({}),
});

export const UpdateAgentActionBody = z.object({
  enabled: z.boolean().optional(),
  config: LeadGenerationConfigSchema.optional(),
});

export const GetAgentActionsQuery = z.object({
  agentId: z.string(),
});

export const ActionModel = new Elysia().model({
  AgentActionSchema,
  CreateAgentActionBody,
  UpdateAgentActionBody,
  GetAgentActionsQuery,
  ManyAgentActionResponse: z.object({
    actions: z.array(AgentActionSchema),
  }),
  OneAgentActionResponse: z.object({
    action: AgentActionSchema,
  }),
  DeleteActionResponse: z.object({
    success: z.boolean(),
  }),
});
