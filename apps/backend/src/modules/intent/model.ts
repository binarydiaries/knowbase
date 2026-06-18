import { z } from 'zod';

// ── Intent ────────────────────────────────────────────────────────────────────

export const IntentExecutionMode = z.enum(['sequential', 'parallel']);

export const IntentResponseConfigSchema = z.object({
  success: z.string().optional(),
  failure: z.string().optional(),
});

export type IIntentResponseConfig = z.infer<typeof IntentResponseConfigSchema>;

export const IntentSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  triggerInstructions: z.string(),
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()).default([]),
  executionMode: IntentExecutionMode,
  config: IntentResponseConfigSchema.nullish(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IIntent = z.infer<typeof IntentSchema>;

// ── Intent Actions ────────────────────────────────────────────────────────────

export const IntentActionType = z.enum([
  'save_lead',
  'send_email',
  'api_trigger',
  'calendar_booking',
]);

const ApiTriggerConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  bodyTemplate: z.record(z.string(), z.string()).optional(),
  responseInstructions: z.string().optional(),
});

const CalendarBookingConfigSchema = z.object({
  provider: z.literal('google'),
  calendarId: z.string(),
});

const SaveLeadConfigSchema = z.object({});

export const SendEmailConfigSchema = z.object({
  subject: z.string().optional(),
  body: z.string().optional(),
});

export type ISendEmailConfig = z.infer<typeof SendEmailConfigSchema>;

export const IntentActionConfigSchema = z.union([
  ApiTriggerConfigSchema,
  CalendarBookingConfigSchema,
  SendEmailConfigSchema,
  SaveLeadConfigSchema,
  z.record(z.string(), z.unknown()),
]);

export const IntentActionSchema = z.object({
  id: z.string(),
  intentId: z.string(),
  order: z.number().int(),
  actionType: IntentActionType,
  config: IntentActionConfigSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IIntentAction = z.infer<typeof IntentActionSchema>;

export const IntentWithActionsSchema = IntentSchema.extend({
  actions: z.array(IntentActionSchema),
});

export type IIntentWithActions = z.infer<typeof IntentWithActionsSchema>;
