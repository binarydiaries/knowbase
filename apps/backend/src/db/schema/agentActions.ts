import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { agents } from './agents';

export const actionType = pgEnum('actionType', [
  'lead_generation',
  'scheduling',
]);

export const agentActions = pgTable(
  'agent_actions',
  {
    id: cuid2PrimaryKey,
    agentId: text()
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    actionType: actionType().notNull(),
    enabled: boolean().notNull().default(true),
    config: jsonb().$type<ActionConfig>().notNull().default({}),
    createdBy: varchar({ length: 64 }).notNull(),
    ...timestamps,
  },
  (t) => [
    index('agent_actions_agent_idx').on(t.agentId),
    unique('agent_actions_agent_type_unique').on(t.agentId, t.actionType),
  ],
);

export type LeadFieldConfig = {
  collect: boolean;
  required: boolean;
};

export type LeadGenerationConfig = {
  fields?: {
    name?: LeadFieldConfig;
    email?: LeadFieldConfig;
    phone?: LeadFieldConfig;
    company?: LeadFieldConfig;
  };
  triggerInstructions?: string;
  successMessage?: string;
};

export type SchedulingConfig = {
  eventTypeId: number;
  timezone: string;
  slotsToShow?: number;
  triggerInstructions?: string;
  confirmationMessage?: string;
};

export type ActionConfig = LeadGenerationConfig | SchedulingConfig;
