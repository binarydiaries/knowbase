import { z } from 'zod';

// ── Workflow ──────────────────────────────────────────────────────────────────

export const WorkflowExecutionMode = z.enum(['sequential', 'parallel']);

export const WorkflowSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  intentName: z.string(),
  requiredFields: z.array(z.string()),
  executionMode: WorkflowExecutionMode,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IWorkflow = z.infer<typeof WorkflowSchema>;

// ── Workflow Actions ──────────────────────────────────────────────────────────

export const WorkflowActionType = z.enum([
  'save_lead',
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

const SaveLeadConfigSchema = z.object({
  successMessage: z.string().optional(),
});

export const WorkflowActionConfig = z.union([
  ApiTriggerConfigSchema,
  CalendarBookingConfigSchema,
  SaveLeadConfigSchema,
  z.record(z.string(), z.unknown()),
]);

export const WorkflowActionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  order: z.number().int(),
  actionType: WorkflowActionType,
  config: WorkflowActionConfig,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IWorkflowAction = z.infer<typeof WorkflowActionSchema>;

export const WorkflowWithActionsSchema = WorkflowSchema.extend({
  actions: z.array(WorkflowActionSchema),
});

export type IWorkflowWithActions = z.infer<typeof WorkflowWithActionsSchema>;
