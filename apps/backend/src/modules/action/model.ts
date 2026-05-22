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

const SchedulingConfigSchema = z.object({
  eventTypeId: z.number().int().positive(),
  timezone: z.string().min(1),
  slotsToShow: z.number().int().min(1).max(20).optional(),
  triggerInstructions: z.string().max(300).optional(),
  confirmationMessage: z.string().max(200).optional(),
});

const ActionConfigSchema = z.union([
  LeadGenerationConfigSchema,
  SchedulingConfigSchema,
]);

export const AgentActionSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  actionType: z.enum(['lead_generation', 'scheduling']),
  enabled: z.boolean(),
  config: ActionConfigSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateAgentActionBody = z.discriminatedUnion('actionType', [
  z.object({
    agentId: z.string(),
    actionType: z.literal('lead_generation'),
    config: LeadGenerationConfigSchema.optional().default({}),
  }),
  z.object({
    agentId: z.string(),
    actionType: z.literal('scheduling'),
    config: SchedulingConfigSchema.optional().default({
      eventTypeId: 0,
      timezone: 'auto',
    }),
  }),
]);

export const UpdateAgentActionBody = z.object({
  enabled: z.boolean().optional(),
  config: ActionConfigSchema.optional(),
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
