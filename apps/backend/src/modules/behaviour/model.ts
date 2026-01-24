import { Elysia } from 'elysia';
import { z } from 'zod';

const BehaviourTone = z.enum(['friendly', 'professional', 'neutral']);
const BehaviourVerbosity = z.enum(['short', 'balanced', 'detailed']);

const Behaviour = z.object({
  id: z.string(),
  chatbotId: z.string(),
  systemPrompt: z.string(),
  tone: BehaviourTone,
  verbosity: BehaviourVerbosity,
  fallbackMessage: z.string(),
  guardrails: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const OneBehaviourResponse = z.object({
  behaviour: Behaviour,
});

const ManyBehaviourResponse = z.object({
  behaviours: z.array(Behaviour),
});

const OneBehaviourParams = z.object({
  id: z.string(),
});
export const UpdateBehaviourBody = Behaviour.pick({
  tone: true,
  systemPrompt: true,
  guardrails: true,
  verbosity: true,
  fallbackMessage: true,
}).partial();

export const BehaviourModel = new Elysia().model({
  UpdateBehaviourBody,
  OneBehaviourResponse,
  OneBehaviourParams,
  ManyBehaviourResponse,
});
