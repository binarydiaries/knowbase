import { ChatOpenAI } from '@langchain/openai';

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Main model for RAG response generation.
 * Matches the model used by the v1 backend chat service.
 * Falls back to OpenAI when provider is unrecognised.
 */
export function createLlm(provider: string = 'openai', modelName?: string) {
  switch (provider) {
    case 'anthropic':
    case 'gemini':
      // Future providers — fall back to OpenAI until adapters are added
      console.warn(
        `[llm] provider "${provider}" not yet supported, falling back to openai`,
      );
      return new ChatOpenAI({
        model: modelName ?? 'gpt-4.1-mini',
        temperature: 0.3,
      });
    default:
      return new ChatOpenAI({
        model: modelName ?? 'gpt-4.1-mini',
        temperature: 0.3,
      });
  }
}

/** Nano/cheap model for utility calls (entity extraction, intent detection, rewriting, sentiment). */
export function createNanoLlm() {
  return new ChatOpenAI({
    model: 'gpt-4.1-nano',
    temperature: 0,
  });
}
