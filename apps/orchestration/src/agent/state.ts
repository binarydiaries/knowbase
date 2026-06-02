import { MessagesValue, StateSchema} from "@langchain/langgraph";
import { z } from "zod";


export const stateSchema = new StateSchema({
  messages: MessagesValue,
  currentStep: z.string(),
});