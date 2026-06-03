import { ChatOpenAI } from '@langchain/openai';

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Returns a ChatModel instance based on the agent's configured provider.
 * Falls back to OpenAI gpt-4.1-mini when provider is unrecognised.
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
        model: modelName ?? 'gpt-4o-mini',
        temperature: 0.3,
      });
    default:
      return new ChatOpenAI({
        model: modelName ?? 'gpt-4o-mini',
        temperature: 0.3,
      });
  }
}

/** Nano/cheap model for utility calls (entity extraction, intent detection, etc.) */
export function createNanoLlm() {
  return new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });
}
