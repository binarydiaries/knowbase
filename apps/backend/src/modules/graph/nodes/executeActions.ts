import type { GraphNode } from '@langchain/langgraph';
import type { z } from 'zod';
import { LeadService } from '../../lead/service';
import type { WorkflowActionSchema } from '../../workflow/model';
import { ConfigSchema } from '../config';
import type { ActionResult, State } from '../state';

type IActionResult = z.infer<typeof ActionResult>;

async function executeAction(
  action: z.infer<typeof WorkflowActionSchema>,
  state: typeof State.State,
  configurable?: Record<string, any>,
): Promise<IActionResult> {
  const { agentId, orgId, channelId, thread_id } =
    ConfigSchema.parse(configurable);

  if (!agentId || !orgId || !channelId || !thread_id) {
    throw new Error('No agentId or channelId or thread_id');
  }

  try {
    const { name, email, phone } = state.entities as Record<string, string>;
    switch (action.actionType) {
      case 'save_lead':
        return LeadService.create({
          agentId,
          orgId,
          channelId,
          conversationId: thread_id,
          name,
          email,
          phone,
        }).then(async (res) => ({
          success: true,
          data: { leadId: res.id },
        }));
      // return await executeSaveLead(action.config, ctx);
      // case 'api_trigger':
      //   return await executeApiTrigger(action.config, ctx, priorResults);
      // case 'calendar_booking':
      //   return await executeCalendarBooking(action.config, ctx);
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

  const settled = await Promise.allSettled(
    activeWorkflow.actions.map((action) =>
      executeAction(action, state, config.configurable).then((r) => ({
        id: action.id,
        result: r,
      })),
    ),
  );
  for (const s of settled) {
    if (s.status === 'fulfilled') results[s.value.id] = s.value.result;
  }

  return {
    actionResults: results,
  };
};
