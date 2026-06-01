import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

export type AgentConfig = {
  systemPrompt: string;
  tone: string;
  verbosity: string;
  fallbackMessage: string;
  guardrails?: string | null;
};

export type WorkflowDef = {
  id: string;
  name: string;
  intentName: string;
  requiredFields: string[];
  executionMode: 'sequential' | 'parallel';
  actions: WorkflowActionDef[];
};

export type WorkflowActionDef = {
  id: string;
  order: number;
  actionType: 'save_lead' | 'api_trigger' | 'calendar_booking';
  config: Record<string, unknown>;
};

export type RagChunk = {
  similarity: number;
  content: string;
  documentId: string;
  documentVersion: number;
  chunkIndex: number;
};

export type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/** Merges entities: never overwrite a non-null existing value with null/undefined */
function mergeEntities(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

export const AgentStateAnnotation = Annotation.Root({
  // ── Conversation ─────────────────────────────────────────────────────────
  messages: Annotation<BaseMessage[], BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  conversationId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  agentId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  orgId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  channelId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  /** Raw user message (before reference resolution) */
  userMessage: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  /** IP address for geo enrichment */
  ip: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  // ── Loaded config ─────────────────────────────────────────────────────────
  agentConfig: Annotation<AgentConfig | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  workflows: Annotation<WorkflowDef[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── Intent + routing ──────────────────────────────────────────────────────
  intent: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  activeWorkflow: Annotation<WorkflowDef | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  // ── Entity accumulation ───────────────────────────────────────────────────
  entities: Annotation<Record<string, unknown>>({
    reducer: mergeEntities,
    default: () => ({}),
  }),
  missingFields: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── RAG ───────────────────────────────────────────────────────────────────
  finalQuery: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  ragChunks: Annotation<RagChunk[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── Actions ───────────────────────────────────────────────────────────────
  actionResults: Annotation<Record<string, ActionResult>>({
    reducer: (existing, incoming) => ({ ...existing, ...incoming }),
    default: () => ({}),
  }),

  // ── Output ────────────────────────────────────────────────────────────────
  response: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;
