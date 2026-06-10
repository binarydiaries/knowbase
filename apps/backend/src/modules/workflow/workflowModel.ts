import { Elysia } from 'elysia';
import { z } from 'zod';
import { WorkflowActionSchema, WorkflowSchema, WorkflowWithActionsSchema } from './model';

// ── Input schemas ─────────────────────────────────────────────────────────────

const WorkflowActionInputSchema = z.object({
  actionType: z.enum(['save_lead', 'api_trigger', 'calendar_booking']),
  order: z.number().int().min(0).default(0),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const CreateWorkflowBody = z.object({
  agentId: z.string(),
  name: z.string().min(1).max(100),
  intentName: z.string().min(1).max(300),
  requiredFields: z.array(z.string()).default([]),
  executionMode: z.enum(['sequential', 'parallel']).default('sequential'),
  config: z
    .object({
      success: z.string().max(300).optional(),
      failure: z.string().max(300).optional(),
    })
    .optional(),
  actions: z.array(WorkflowActionInputSchema).default([]),
});

export const UpdateWorkflowBody = z.object({
  name: z.string().min(1).max(100).optional(),
  intentName: z.string().min(1).max(300).optional(),
  requiredFields: z.array(z.string()).optional(),
  config: z
    .object({
      success: z.string().max(300).optional(),
      failure: z.string().max(300).optional(),
    })
    .optional(),
  actions: z.array(WorkflowActionInputSchema).optional(),
});

// ── Response schemas ──────────────────────────────────────────────────────────

const OneWorkflowResponse = z.object({ workflow: WorkflowWithActionsSchema });
const ManyWorkflowsResponse = z.object({
  workflows: z.array(WorkflowWithActionsSchema),
});
const DeleteWorkflowResponse = z.object({ success: z.boolean() });

// ── Elysia model plugin ───────────────────────────────────────────────────────

export const WorkflowModel = new Elysia().model({
  WorkflowSchema,
  WorkflowActionSchema,
  WorkflowWithActionsSchema,
  CreateWorkflowBody,
  UpdateWorkflowBody,
  OneWorkflowResponse,
  ManyWorkflowsResponse,
  DeleteWorkflowResponse,
});
