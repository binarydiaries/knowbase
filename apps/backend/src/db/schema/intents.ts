import { index, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { agents } from './agents.js';

export const intentExecutionMode = pgEnum('intentExecutionMode', [
  'sequential',
  'parallel',
]);

export const intents = pgTable(
  'intents',
  {
    id: cuid2PrimaryKey,
    agentId: text()
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    triggerInstructions: text().notNull().default(''),
    requiredFields: text().array().notNull().default([]),
    optionalFields: text().array().notNull().default([]),
    executionMode: intentExecutionMode().notNull().default('sequential'),
    config: jsonb().$type<{ success?: string; failure?: string }>(),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (t) => [index('intents_agent_idx').on(t.agentId)],
);
