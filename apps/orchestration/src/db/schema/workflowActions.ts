import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../utils/columns.js';
import { workflows } from './workflows.js';

export const workflowActionType = pgEnum('workflowActionType', [
  'save_lead',
  'api_trigger',
  'calendar_booking',
]);

export type ApiTriggerConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, string>;
  responseInstructions?: string;
};

export type CalendarBookingConfig = {
  provider: 'google';
  calendarId: string;
};

export type SaveLeadConfig = {
  successMessage?: string;
};

export type WorkflowActionConfig =
  | ApiTriggerConfig
  | CalendarBookingConfig
  | SaveLeadConfig
  | Record<string, unknown>;

export const workflowActions = pgTable(
  'workflow_actions',
  {
    id: cuid2PrimaryKey,
    workflowId: text().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    order: integer().notNull().default(0),
    actionType: workflowActionType().notNull(),
    config: jsonb().$type<WorkflowActionConfig>().notNull().default({}),
    ...timestamps,
  },
  (t) => [index('workflow_actions_workflow_idx').on(t.workflowId)],
);
