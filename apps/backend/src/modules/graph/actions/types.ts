export type IActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Everything an action handler needs to do its job.
 * Built once per action execution from the LangGraph state + configurable.
 */
export type ActionContext = {
  agentId: string;
  orgId: string;
  channelId: string;
  /** LangGraph thread / conversation ID */
  conversationId: string;
  /** Entities extracted from the conversation (name, email, phone, company, …) */
  entities: Record<string, string | null>;
  /** Per-action config from the workflow definition */
  config?: unknown;
  /** Results from actions that ran before this one (sequential mode only) */
  previousResults?: Record<string, IActionResult>;
};
