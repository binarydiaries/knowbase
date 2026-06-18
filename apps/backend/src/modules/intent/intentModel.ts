import { Elysia } from 'elysia';
import { z } from 'zod';
import { IntentActionSchema, IntentSchema, IntentWithActionsSchema } from './model';

// ── Input schemas ─────────────────────────────────────────────────────────────

const IntentActionInputSchema = z.object({
  actionType: z.enum(['save_lead', 'send_email', 'api_trigger', 'calendar_booking']),
  order: z.number().int().min(0).default(0),
  config: z.record(z.string(), z.unknown()).default({}),
});

const fieldNameItem = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/, 'Field names must be alphanumeric, underscore, or hyphen only');
const fieldNamesArray = z.array(fieldNameItem).max(20).default([]);

function noOverlap(val: { requiredFields?: string[]; optionalFields?: string[] }): boolean {
  const req = new Set(val.requiredFields ?? []);
  return !(val.optionalFields ?? []).some((f) => req.has(f));
}
const overlapMessage = 'A field cannot appear in both requiredFields and optionalFields';

export const CreateIntentBody = z
  .object({
    agentId: z.string(),
    name: z.string().min(1).max(100),
    triggerInstructions: z.string().max(300).default(''),
    requiredFields: fieldNamesArray,
    optionalFields: fieldNamesArray,
    executionMode: z.enum(['sequential', 'parallel']).default('sequential'),
    config: z
      .object({
        success: z.string().max(300).optional(),
        failure: z.string().max(300).optional(),
      })
      .optional(),
    actions: z.array(IntentActionInputSchema).default([]),
  })
  .refine(noOverlap, { message: overlapMessage, path: ['optionalFields'] });

export const UpdateIntentBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    triggerInstructions: z.string().max(300).optional(),
    requiredFields: z.array(fieldNameItem).max(20).optional(),
    optionalFields: z.array(fieldNameItem).max(20).optional(),
    config: z
      .object({
        success: z.string().max(300).optional(),
        failure: z.string().max(300).optional(),
      })
      .optional(),
    actions: z.array(IntentActionInputSchema).optional(),
  })
  .refine(noOverlap, { message: overlapMessage, path: ['optionalFields'] });

// ── Response schemas ──────────────────────────────────────────────────────────

const OneIntentResponse = z.object({ intent: IntentWithActionsSchema });
const ManyIntentsResponse = z.object({
  intents: z.array(IntentWithActionsSchema),
});
const DeleteIntentResponse = z.object({ success: z.boolean() });

// ── Elysia model plugin ───────────────────────────────────────────────────────

export const IntentModel = new Elysia().model({
  IntentSchema,
  IntentActionSchema,
  IntentWithActionsSchema,
  CreateIntentBody,
  UpdateIntentBody,
  OneIntentResponse,
  ManyIntentsResponse,
  DeleteIntentResponse,
});
