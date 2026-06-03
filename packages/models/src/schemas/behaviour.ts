import { z } from 'zod';

export const BehaviourTone = z.enum(['friendly', 'professional', 'neutral']);
export const BehaviourVerbosity = z.enum(['short', 'balanced', 'detailed']);

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

export const UpdateBehaviourBody = BehaviourSchema.pick({
  tone: true,
  systemPrompt: true,
  guardrails: true,
  verbosity: true,
  fallbackMessage: true,
}).partial();
