import { Elysia } from 'elysia';
import { z } from 'zod';

const BehaviourTone = z.enum(['friendly', 'professional', 'neutral']);
const BehaviourVerbosity = z.enum(['short', 'balanced', 'detailed']);

export const BehaviourSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  systemPrompt: z.string(),
  tone: BehaviourTone,
  verbosity: BehaviourVerbosity,
  fallbackMessage: z.string(),
  guardrails: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const OneBehaviourResponse = z.object({
  behaviour: BehaviourSchema,
});

const ManyBehaviourResponse = z.object({
  behaviours: z.array(BehaviourSchema),
});

export const UpdateBehaviourBody = BehaviourSchema.pick({
  tone: true,
  systemPrompt: true,
  guardrails: true,
  verbosity: true,
  fallbackMessage: true,
}).partial();

export const BehaviourModel = new Elysia().model({
  UpdateBehaviourBody,
  OneBehaviourResponse,
  ManyBehaviourResponse,
  BehaviourSchema,
});
