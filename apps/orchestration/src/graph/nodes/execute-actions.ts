import { executeSaveLead } from '../../actions/save-lead.js';
import { executeApiTrigger } from '../../actions/api-trigger.js';
import { executeCalendarBooking } from '../../actions/calendar-booking.js';
import type { AgentState, AgentStateUpdate, ActionResult, WorkflowActionDef } from '../state.js';

export type ActionContext = {
  agentId: string;
  conversationId: string;
  channelId: string;
  orgId: string;
  entities: Record<string, unknown>;
};

async function executeAction(
  action: WorkflowActionDef,
  ctx: ActionContext,
  priorResults: Record<string, ActionResult>,
): Promise<ActionResult> {
  try {
    switch (action.actionType) {
      case 'save_lead':
        return await executeSaveLead(action.config, ctx);
      case 'api_trigger':
        return await executeApiTrigger(action.config, ctx, priorResults);
      case 'calendar_booking':
        return await executeCalendarBooking(action.config, ctx);
      default:
        return { success: false, error: `Unknown action type: ${action.actionType}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function executeActions(state: AgentState): Promise<AgentStateUpdate> {
  const { activeWorkflow, agentId, conversationId, channelId, orgId, entities } = state;

  if (!activeWorkflow || activeWorkflow.actions.length === 0) {
    return {};
  }

  const ctx: ActionContext = { agentId, conversationId, channelId, orgId, entities };
  const results: Record<string, ActionResult> = {};

  if (activeWorkflow.executionMode === 'parallel') {
    const settled = await Promise.allSettled(
      activeWorkflow.actions.map((action) =>
        executeAction(action, ctx, {}).then((r) => ({ id: action.id, result: r })),
      ),
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results[s.value.id] = s.value.result;
      }
    }
  } else {
    // Sequential: each action receives prior results
    for (const action of activeWorkflow.actions) {
      results[action.id] = await executeAction(action, ctx, results);
    }
  }

  return { actionResults: results };
}
