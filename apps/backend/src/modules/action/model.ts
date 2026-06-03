import { Elysia } from 'elysia';
import { z } from 'zod';
import {
  AgentActionSchema,
  LeadGenerationConfigSchema,
} from '@knowbase/models/schemas';

export { AgentActionSchema };

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
