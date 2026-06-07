/**
 * System-level intents that are always available regardless of workflow config.
 * Workflow intents (e.g. "lead_capture", "book_demo") are dynamic — they come
 * from the agent's configured workflows and are not listed here.
 */
export const INTENT_QUESTION_ANSWERING = 'question_answering' as const;

export type SystemIntent = typeof INTENT_QUESTION_ANSWERING;
