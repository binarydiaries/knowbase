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

export const ChatbotActionSchema = z.object({
  id: z.string(),
  chatbotId: z.string(),
  actionType: z.enum(['lead_generation']),
  enabled: z.boolean(),
  config: LeadGenerationConfigSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateChatbotActionBody = z.object({
  chatbotId: z.string(),
  actionType: z.enum(['lead_generation']),
  config: LeadGenerationConfigSchema.optional().default({}),
});

export const UpdateChatbotActionBody = z.object({
  enabled: z.boolean().optional(),
  config: LeadGenerationConfigSchema.optional(),
});

export const GetChatbotActionsQuery = z.object({
  chatbotId: z.string(),
});

export const ActionModel = new Elysia().model({
  ChatbotActionSchema,
  CreateChatbotActionBody,
  UpdateChatbotActionBody,
  GetChatbotActionsQuery,
  ManyChatbotActionResponse: z.object({
    actions: z.array(ChatbotActionSchema),
  }),
  OneChatbotActionResponse: z.object({
    action: ChatbotActionSchema,
  }),
  DeleteActionResponse: z.object({
    success: z.boolean(),
  }),
});
