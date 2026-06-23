import { apiTrigger } from './apiTrigger';
import { saveLead } from './saveLead';
import { sendEmail } from './sendEmail';
import type { ActionContext, IActionResult } from './types';

export type { ActionContext, IActionResult };

type ActionHandler = (ctx: ActionContext) => Promise<IActionResult>;

/**
 * Registry of all supported intent action handlers.
 * Add a new entry here when introducing a new action type.
 */
export const actionHandlers: Record<string, ActionHandler> = {
  save_lead: saveLead,
  send_email: sendEmail,
  api_trigger: apiTrigger,
};
