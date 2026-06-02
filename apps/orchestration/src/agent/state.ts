import { MessagesValue, StateSchema} from "@langchain/langgraph";
import { z } from "zod";


export const inputStateSchema = new StateSchema({
  messages: MessagesValue,
});

const agentConfig = z.object().optional()

export const internalStateSchema = new StateSchema({
  agentConfig: agentConfig,
});

export const outputStateSchema = new StateSchema({
  messages: MessagesValue,
});