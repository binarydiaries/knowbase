import type { ActionContext } from '../graph/nodes/execute-actions.js';
import type { ActionResult } from '../graph/state.js';

// Placeholder — Google Calendar integration to be implemented
export async function executeCalendarBooking(
  _config: Record<string, unknown>,
  _ctx: ActionContext,
): Promise<ActionResult> {
  return {
    success: false,
    error: 'calendar_booking is not yet implemented',
  };
}
