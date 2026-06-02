import { MessagesValue, StateSchema} from "@langchain/langgraph";
import { z } from "zod";

const agentConfig = z.object().optional()

export const inputStateSchema = new StateSchema({
  messages: MessagesValue,
});

export const internalStateSchema = new StateSchema({
  agentConfig: agentConfig,
  messages: MessagesValue,
});

export const outputStateSchema = new StateSchema({
  messages: MessagesValue,
});
export const graphConfigSchema = z.object({
  agentId: z.string().describe('Agent ID from the dashboard'),
  orgId: z.string().describe('Clerk organisation ID'),
  channelId: z.string().describe('Channel ID the message came from'),
  ip: z.string().optional().describe('Client IP address (for geo enrichment, optional)'),
});

export type IInternalStateSchema = typeof internalStateSchema;