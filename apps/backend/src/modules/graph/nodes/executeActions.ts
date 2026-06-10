import { AIMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { z } from 'zod';
import { LeadService } from '../../lead/service';
import type { WorkflowActionSchema } from '../../workflow/model';
import { ConfigSchema } from '../config';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { State } from '../state';

const DEFAULT_SUCCESS = 'Done! Your request has been submitted.';
const DEFAULT_FAILURE =
  'Something went wrong. Please try again or contact support at hello@agenvik.com.';

type IActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

async function executeAction(
  action: z.infer<typeof WorkflowActionSchema>,
  state: typeof State.State,
  configurable?: Record<string, unknown>,
): Promise<IActionResult> {
  const { agentId, orgId, channelId, thread_id } =
    ConfigSchema.parse(configurable);

  if (!agentId || !orgId || !channelId || !thread_id) {
    throw new Error(
      'Missing required configurable: agentId, orgId, channelId, or thread_id',
    );
  }

  try {
    const { name, email, phone, company } = state.entities as Record<string, string>;
    switch (action.actionType) {
      case 'save_lead':
        console.log('[executeActions] save_lead called', { agentId, orgId, channelId, thread_id, name, email, phone, company });
        return LeadService.create({
          agentId,
          orgId,
          channelId,
          conversationId: thread_id,
          name,
          email,
          phone,
          company,
        }).then((res) => {
          console.log('[executeActions] save_lead result', { id: res?.id });
          return { success: true, data: { leadId: res?.id } };
        }).catch((err) => {
          console.error('[executeActions] save_lead error', err);
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        });
      default:
        return {
          success: false,
          error: `Unknown action type: ${action.actionType}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const executeActions: GraphNode<typeof State> = async (
  state,
  config,
) => {
  const { activeWorkflow } = state;
  if (!activeWorkflow) return {};

  // Workflow has no actions configured — still complete it cleanly so the
  // checkpoint doesn't get stuck with a dangling activeWorkflow that would
  // loop back into this node on every subsequent turn.
  if (activeWorkflow.actions.length === 0) {
    return {
      activeWorkflow: undefined,
      intent: INTENT_QUESTION_ANSWERING,
      messages: [
        new AIMessage(
          activeWorkflow.config?.success?.trim() || DEFAULT_SUCCESS,
        ),
      ],
    };
  }

  const results: Record<string, IActionResult> = {};

  if (activeWorkflow.executionMode === 'sequential') {
    for (const action of activeWorkflow.actions) {
      const result = await executeAction(action, state, config.configurable);
      results[action.id] = result;
    }
  } else {
    const settled = await Promise.allSettled(
      activeWorkflow.actions.map((action) =>
        executeAction(action, state, config.configurable),
      ),
    );
    activeWorkflow.actions.forEach((action, i) => {
      const s = settled[i];
      results[action.id] =
        s.status === 'fulfilled'
          ? s.value
          : {
              success: false,
              error:
                s.reason instanceof Error ? s.reason.message : String(s.reason),
            };
    });
  }

  const succeeded = Object.values(results).every((r) => r.success);
  const workflowConfig = activeWorkflow.config;
  const message = succeeded
    ? workflowConfig?.success?.trim() || DEFAULT_SUCCESS
    : workflowConfig?.failure?.trim() || DEFAULT_FAILURE;

  // Workflow is done — clear activeWorkflow and reset intent so the next
  // user message is not incorrectly routed back into this workflow.
  return {
    activeWorkflow: undefined,
    intent: INTENT_QUESTION_ANSWERING,
    messages: [new AIMessage(message)],
  };
};
