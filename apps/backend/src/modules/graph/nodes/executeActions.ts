import type { GraphNode } from '@langchain/langgraph';
import type { z } from 'zod';
import { LeadService } from '../../lead/service';
import type { WorkflowActionSchema } from '../../workflow/model';
import { ConfigSchema } from '../config';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { ActionResult, State } from '../state';

type IActionResult = z.infer<typeof ActionResult>;

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
    const { name, email, phone } = state.entities as Record<string, string>;
    switch (action.actionType) {
      case 'save_lead':
        return LeadService.create({
          agentId,
          orgId,
          channelId,
          conversationId: 'ccec014d-7ff0-4777-bb3f-7dc2d34245d7',
          name,
          email,
          phone,
        }).then((res) => ({
          success: true,
          data: { leadId: res.id },
        }));
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
  if (!activeWorkflow || activeWorkflow.actions.length === 0) return {};

  const results: Record<string, IActionResult> = {};

  if (activeWorkflow.executionMode === 'sequential') {
    for (const action of activeWorkflow.actions) {
      const result = await executeAction(action, state, config.configurable);
      results[action.id] = result;
    }
  } else {
    const settled = await Promise.allSettled(
      activeWorkflow.actions.map((action) =>
        executeAction(action, state, config.configurable).then((result) => ({
          id: action.id,
          result,
        })),
      ),
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results[s.value.id] = s.value.result;
    }
  }

  // Workflow is done — clear activeWorkflow and reset intent so the next
  // user message is not incorrectly routed back into this workflow.
  return {
    actionResults: results,
    activeWorkflow: undefined,
    intent: INTENT_QUESTION_ANSWERING,
  };
};
