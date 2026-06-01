import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

// ── Column utilities ──────────────────────────────────────────────────────────

const timestamps = {
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
};

const cuid2PrimaryKey = text()
  .primaryKey()
  .$defaultFn(() => createId());

// ── agents ────────────────────────────────────────────────────────────────────

export const agentStatusEnum = pgEnum('agentStatus', ['active', 'archived']);

export const agents = pgTable('agents', {
  id: cuid2PrimaryKey,
  name: text().notNull(),
  description: text(),
  agentStatus: agentStatusEnum().notNull().default('active'),
  orgId: varchar({ length: 64 }).notNull(),
  ...timestamps,
});

// ── behaviors ─────────────────────────────────────────────────────────────────

export const toneEnum = pgEnum('tone', ['friendly', 'professional', 'neutral']);
export const verbosityEnum = pgEnum('verbosity', ['short', 'balanced', 'detailed']);

export const behaviors = pgTable('behavior', {
  id: cuid2PrimaryKey,
  agentId: text().notNull().references(() => agents.id),
  systemPrompt: text().notNull(),
  tone: toneEnum().notNull().default('neutral'),
  verbosity: verbosityEnum().notNull().default('balanced'),
  fallbackMessage: text().notNull(),
  guardrails: text(),
  ...timestamps,
});

// ── workflows ─────────────────────────────────────────────────────────────────

export const workflowExecutionModeEnum = pgEnum('workflowExecutionMode', [
  'sequential',
  'parallel',
]);

export const workflows = pgTable(
  'workflows',
  {
    id: cuid2PrimaryKey,
    agentId: text().notNull().references(() => agents.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    intentName: text().notNull(),
    requiredFields: text().array().notNull().default([]),
    executionMode: workflowExecutionModeEnum().notNull().default('sequential'),
    ...timestamps,
  },
  (t) => [index('workflows_agent_idx').on(t.agentId)],
);

// ── workflowActions ───────────────────────────────────────────────────────────

export const workflowActionTypeEnum = pgEnum('workflowActionType', [
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

export type SaveLeadConfig = {
  successMessage?: string;
};

export type WorkflowActionConfig = ApiTriggerConfig | SaveLeadConfig | Record<string, unknown>;

export const workflowActions = pgTable(
  'workflow_actions',
  {
    id: cuid2PrimaryKey,
    workflowId: text().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    order: integer().notNull().default(0),
    actionType: workflowActionTypeEnum().notNull(),
    config: jsonb().$type<WorkflowActionConfig>().notNull().default({}),
    ...timestamps,
  },
  (t) => [index('workflow_actions_workflow_idx').on(t.workflowId)],
);

// ── channels ──────────────────────────────────────────────────────────────────

export const channelTypeEnum = pgEnum('channelType', ['web', 'whatsapp', 'slack']);

export const channels = pgTable('channels', {
  id: cuid2PrimaryKey,
  agentId: text().notNull().references(() => agents.id),
  orgId: varchar({ length: 64 }).notNull(),
  type: channelTypeEnum().notNull(),
  config: jsonb().notNull().default({}),
  ...timestamps,
});

// ── conversations ─────────────────────────────────────────────────────────────

export const conversations = pgTable(
  'conversations',
  {
    id: cuid2PrimaryKey,
    agentId: text().notNull().references(() => agents.id),
    channelId: text().notNull().references(() => channels.id),
    lastUserQuestion: text().notNull(),
    lastAssistantUtterance: text().notNull(),
    lastMessageAt: timestamp({ withTimezone: true }).notNull(),
    country: text(),
    topic: text(),
    externalId: text(),
    entities: jsonb('entities').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    index('conversations_agent_idx').on(t.agentId),
    index('conversations_channel_external_idx').on(t.channelId, t.externalId),
  ],
);

// ── messages ──────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['user', 'assistant']);

export type MessageSource = {
  documentId: string;
  documentVersion: number;
  chunkIndex: number;
  similarity: number;
};

export type MessageMetadata = {
  confidenceScore: number | null;
  sources?: MessageSource[] | null;
  sentiment?: { label: 'positive' | 'neutral' | 'negative'; score: number } | null;
};

export type MessageSystemMetadata = {
  finalQuery?: string;
};

export const messages = pgTable(
  'messages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text().notNull().references(() => conversations.id),
    role: roleEnum().notNull(),
    content: text().notNull(),
    metadata: jsonb().$type<MessageMetadata>(),
    systemMetadata: jsonb().$type<MessageSystemMetadata>(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('messages_conversation_created_idx').on(t.conversationId, t.createdAt),
  ],
);

// ── leads ─────────────────────────────────────────────────────────────────────

export const leads = pgTable(
  'leads',
  {
    id: cuid2PrimaryKey,
    agentId: text().notNull().references(() => agents.id, { onDelete: 'cascade' }),
    conversationId: text().references(() => conversations.id, { onDelete: 'set null' }),
    channelId: text().references(() => channels.id, { onDelete: 'set null' }),
    orgId: varchar({ length: 64 }).notNull(),
    name: text(),
    email: text(),
    phone: text(),
    company: text(),
    customFields: jsonb().$type<Record<string, string>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [
    index('leads_agent_idx').on(t.agentId),
    index('leads_org_idx').on(t.orgId),
  ],
);

// ── documents ─────────────────────────────────────────────────────────────────

export const documents = pgTable('documents', {
  id: cuid2PrimaryKey,
  agentId: text().references(() => agents.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  version: integer().notNull().default(1),
  ...timestamps,
});

// ── embeddings ────────────────────────────────────────────────────────────────

export const embeddings = pgTable(
  'embeddings',
  {
    id: cuid2PrimaryKey,
    documentId: text()
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    documentVersion: integer().notNull(),
    chunkIndex: integer().notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    ...timestamps,
  },
  (t) => [
    index('embeddingIndex').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ],
);

// ── orgSubscriptions (for plan checks) ───────────────────────────────────────

export const orgSubscriptions = pgTable('org_subscriptions', {
  id: cuid2PrimaryKey,
  orgId: varchar({ length: 64 }).notNull(),
  plan: text().notNull().default('free'),
  ...timestamps,
});

// ── orgUsageMonthly ───────────────────────────────────────────────────────────

export const orgUsageMonthly = pgTable('org_usage_monthly', {
  id: cuid2PrimaryKey,
  orgId: varchar({ length: 64 }).notNull(),
  year: integer().notNull(),
  month: integer().notNull(),
  assistantMessages: integer().notNull().default(0),
  ...timestamps,
});

// ── aiCostEvents ──────────────────────────────────────────────────────────────

export const aiCostEvents = pgTable('ai_cost_events', {
  id: cuid2PrimaryKey,
  orgId: varchar({ length: 64 }).notNull(),
  agentId: text(),
  conversationId: text(),
  provider: text().notNull(),
  model: text().notNull(),
  inputTokens: integer().notNull().default(0),
  outputTokens: integer().notNull().default(0),
  metadata: jsonb().$type<Record<string, unknown>>().default({}),
  ...timestamps,
});

// ── agentActions (legacy — kept for backward compat) ─────────────────────────

export const agentActions = pgTable('agent_actions', {
  id: cuid2PrimaryKey,
  agentId: text().notNull().references(() => agents.id, { onDelete: 'cascade' }),
  actionType: text().notNull(),
  enabled: boolean().notNull().default(true),
  config: jsonb().notNull().default({}),
  ...timestamps,
});
