import { Elysia } from 'elysia';
import { z } from 'zod';
import { BehaviourSchema } from '../behaviour/model';
import { ChannelSchema } from '../channel/model';
import { DocumentSchema } from '../document/model';
import { SubscriptionStatusSchema } from '../subscription/model';

const AgentStatus = z.enum(['active', 'archived']);

const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  agentStatus: AgentStatus,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const SmallAgent = AgentSchema.pick({
  id: true,
  name: true,
  description: true,
  agentStatus: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

const SmallAgentWithLock = SmallAgent.extend({
  locked: z.boolean(),
});

const AgentWithLock = AgentSchema.extend({
  locked: z.boolean(),
});

const CreateAgentBody = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const OneAgentResponse = z.object({
  agent: AgentWithLock,
  documents: z.array(DocumentSchema),
  channels: z.array(ChannelSchema),
  behaviour: BehaviourSchema.optional(),
  subscription: SubscriptionStatusSchema,
});

const OneSmallAgentResponse = z.object({
  agent: SmallAgent,
});

const ManyAgentResponse = z.object({
  agents: z.array(SmallAgentWithLock),
  subscription: SubscriptionStatusSchema,
});

export const UpdateAgentBody = AgentSchema.pick({
  name: true,
  description: true,
  agentStatus: true,
}).partial();

export const DeleteAgentResponse = z.undefined();

export const AgentModel = new Elysia().model({
  AgentSchema,
  CreateAgentBody,
  OneAgentResponse,
  ManyAgentResponse,
  UpdateAgentBody,
  DeleteAgentResponse,
  OneSmallAgentResponse,
});
