/**
 * System-level intents that are always available regardless of intent config.
 * Custom intents (e.g. "lead_capture", "book_demo") are dynamic — they come
 * from the agent's configured intents and are not listed here.
 */
export const INTENT_QUESTION_ANSWERING = 'question_answering' as const;

export type SystemIntent = typeof INTENT_QUESTION_ANSWERING;
