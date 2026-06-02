import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Explicit input schema — only `messages` is required from the caller.
 * LangGraph Studio uses this to show the chat input box instead of `{}`.
 * All other state fields are computed by the graph nodes.
 */
export const InputAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

// ── Domain types ─────────────────────────────────────────────────────────────

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

// ── State annotation ─────────────────────────────────────────────────────────
// Only graph-computed data lives here. Runtime identifiers (agentId, orgId,
// conversationId, channelId, ip) live in configurable so the simulator works
// with just { messages: [...] }.

export const AgentStateAnnotation = Annotation.Root({
  // ── Messages (the only required input) ────────────────────────────────────
  messages: Annotation<BaseMessage[], BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // ── Loaded agent config (set by loadAgent node) ───────────────────────────
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

  // ── Entity accumulation (across turns) ───────────────────────────────────
  entities: Annotation<Record<string, unknown>>({
    reducer: mergeEntities,
    default: () => ({}),
  }),
  missingFields: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── RAG ───────────────────────────────────────────────────────────────────
  /** Query after reference resolution — used for vector search */
  finalQuery: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  ragChunks: Annotation<RagChunk[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── Action results ────────────────────────────────────────────────────────
  actionResults: Annotation<Record<string, ActionResult>>({
    reducer: (existing, incoming) => ({ ...existing, ...incoming }),
    default: () => ({}),
  }),

  // ── Final response ────────────────────────────────────────────────────────
  response: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;

// ── Helper: extract raw text from the last human message in state ─────────────
export function getLastUserMessage(state: AgentState): string {
  const lastMsg = [...state.messages].reverse().find(
    (m) => m.getType() === 'human',
  );
  return typeof lastMsg?.content === 'string' ? lastMsg.content : '';
}
