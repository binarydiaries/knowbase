import { index, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { agents } from './agents.js';

export const workflowExecutionMode = pgEnum('workflowExecutionMode', [
  'sequential',
  'parallel',
]);

export const workflows = pgTable(
  'workflows',
  {
    id: cuid2PrimaryKey,
    agentId: text()
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    intentName: text().notNull(),
    requiredFields: text().array().notNull().default([]),
    executionMode: workflowExecutionMode().notNull().default('sequential'),
    config: jsonb().$type<{ success?: string; failure?: string }>(),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (t) => [index('workflows_agent_idx').on(t.agentId)],
);
