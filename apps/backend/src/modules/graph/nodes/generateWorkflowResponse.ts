import { AIMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';

const DEFAULT_SUCCESS = 'Done! Your request has been submitted.';
const DEFAULT_FAILURE =
  'Something went wrong. Please try again or contact support at hello@agenvik.com.';

export const generateWorkflowResponse: GraphNode<typeof State> = (state) => {
  const succeeded = Object.values(state.actionResults ?? {}).every(
    (r) => r.success,
  );

  const config = state.activeWorkflow?.config;
  const message = succeeded
    ? config?.success?.trim() || DEFAULT_SUCCESS
    : config?.failure?.trim() || DEFAULT_FAILURE;

  return { messages: [new AIMessage(message)] };
};
