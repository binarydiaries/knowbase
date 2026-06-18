import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
} from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { intents } from './intents';

export const intentActionType = pgEnum('intentActionType', [
  'save_lead',
  'send_email',
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

export type SaveLeadConfig = Record<string, never>;

export type IntentActionConfig =
  | ApiTriggerConfig
  | CalendarBookingConfig
  | SaveLeadConfig
  | Record<string, unknown>;

export const intentActions = pgTable(
  'intent_actions',
  {
    id: cuid2PrimaryKey,
    intentId: text()
      .notNull()
      .references(() => intents.id, { onDelete: 'cascade' }),
    order: integer().notNull().default(0),
    actionType: intentActionType().notNull(),
    config: jsonb().$type<IntentActionConfig>().notNull().default({}),
    ...timestamps,
  },
  (t) => [index('intent_actions_intent_idx').on(t.intentId)],
);
