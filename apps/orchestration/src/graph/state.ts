import { BehaviourSchema, WorkflowWithActionsSchema } from '@knowbase/models';
import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

export const InputState = new StateSchema({
  messages: MessagesValue,
});

export const State = new StateSchema({
  behaviour: BehaviourSchema,
  messages: MessagesValue,
  workflows: z.array(WorkflowWithActionsSchema),
});

export const OutputState = new StateSchema({
  messages: MessagesValue,
});
export const ConfigSchema = z.object({
  agentId: z.string().optional().describe('Agent ID from the dashboard'),
  orgId: z.string().optional().describe('Clerk organisation ID'),
  channelId: z.string().optional().describe('Channel ID the message came from'),
  ip: z
    .string()
    .optional()
    .describe('Client IP address (for geo enrichment, optional)'),
});
