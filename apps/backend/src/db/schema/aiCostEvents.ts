import { index, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { clerkOrgIdColumn, cuid2PrimaryKey } from '../../utils/columns.utils';

export const aiCostEvents = pgTable(
  'ai_cost_events',
  {
    id: cuid2PrimaryKey,
    ...clerkOrgIdColumn,
    chatbotId: text(),
    conversationId: text(),
    provider: varchar({ length: 64 }).notNull(),
    model: varchar({ length: 128 }).notNull(),
    inputTokens: integer().notNull().default(0),
    outputTokens: integer().notNull().default(0),
    cachedInputTokens: integer().notNull().default(0),
    totalTokens: integer().notNull().default(0),
    costUsd: numeric({ precision: 12, scale: 6 }).notNull(),
    metadata: jsonb(),
    occurredAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ai_cost_events_org_idx').on(table.orgId),
    index('ai_cost_events_org_occurred_idx').on(table.orgId, table.occurredAt),
    index('ai_cost_events_model_idx').on(table.model),
  ],
);
