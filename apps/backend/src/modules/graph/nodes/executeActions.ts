import { AIMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { z } from 'zod';
import type { WorkflowActionSchema } from '../../workflow/model';
import { actionHandlers, type IActionResult } from '../actions';
import { ConfigSchema } from '../config';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { State } from '../state';

const DEFAULT_SUCCESS = 'Done! Your request has been submitted.';
const DEFAULT_FAILURE =
  'Something went wrong. Please try again or contact support at hello@agenvik.com.';

async function executeAction(
  action: z.infer<typeof WorkflowActionSchema>,
  state: typeof State.State,
  configurable?: Record<string, unknown>,
  previousResults?: Record<string, IActionResult>,
): Promise<IActionResult> {
  const { agentId, orgId, channelId, thread_id } = ConfigSchema.parse(configurable);

  if (!agentId || !orgId || !channelId || !thread_id) {
    throw new Error('Missing required configurable: agentId, orgId, channelId, or thread_id');
  }

  const handler = actionHandlers[action.actionType];
  if (!handler) {
    return { success: false, error: `Unknown action type: ${action.actionType}` };
  }

  try {
    return await handler({
      agentId,
      orgId,
      channelId,
      conversationId: thread_id,
      entities: state.entities as Record<string, string | null>,
      config: action.config,
      previousResults,
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const executeActions: GraphNode<typeof State> = async (state, config) => {
  const { activeWorkflow } = state;
  if (!activeWorkflow) return {};

  // Workflow has no actions configured — still complete it cleanly so the
  // checkpoint doesn't get stuck with a dangling activeWorkflow.
  if (activeWorkflow.actions.length === 0) {
    return {
      activeWorkflow: undefined,
      intent: INTENT_QUESTION_ANSWERING,
      messages: [new AIMessage(activeWorkflow.config?.success?.trim() || DEFAULT_SUCCESS)],
    };
  }

  const results: Record<string, IActionResult> = {};

  if (activeWorkflow.executionMode === 'sequential') {
    for (const action of activeWorkflow.actions) {
      // Pass accumulated results so later actions can reference data
      // produced by earlier ones (e.g. save_lead's leadId).
      results[action.id] = await executeAction(action, state, config.configurable, results);
    }
  } else {
    const settled = await Promise.allSettled(
      activeWorkflow.actions.map((action) => executeAction(action, state, config.configurable)),
    );
    activeWorkflow.actions.forEach((action, i) => {
      const s = settled[i];
      results[action.id] =
        s.status === 'fulfilled'
          ? s.value
          : { success: false, error: s.reason instanceof Error ? s.reason.message : String(s.reason) };
    });
  }

  const succeeded = Object.values(results).every((r) => r.success);
  const workflowConfig = activeWorkflow.config;
  const message = succeeded
    ? workflowConfig?.success?.trim() || DEFAULT_SUCCESS
    : workflowConfig?.failure?.trim() || DEFAULT_FAILURE;

  // Workflow is done — clear activeWorkflow and reset intent.
  return {
    activeWorkflow: undefined,
    intent: INTENT_QUESTION_ANSWERING,
    messages: [new AIMessage(message)],
  };
};
