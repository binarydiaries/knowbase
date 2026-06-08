import { ChatOpenAI } from '@langchain/openai';

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Main model for RAG response generation — streaming enabled so that tokens
 * are forwarded to the client in real-time via LangGraph streamMode:'messages'.
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
        streaming: true,
      });
    default:
      return new ChatOpenAI({
        model: modelName ?? 'gpt-4.1-mini',
        temperature: 0.3,
        streaming: true,
      });
  }
}

/**
 * Nano model for user-facing short responses (e.g. collectMissingData).
 * Streaming enabled so the response reaches the client via the messages stream.
 */
export function createStreamingNanoLlm() {
  return new ChatOpenAI({
    model: 'gpt-4.1-nano',
    temperature: 0,
    streaming: true,
  });
}

/**
 * Nano model for internal utility calls (entity extraction, intent detection,
 * query rewriting). NOT streaming — these results must not leak to the client.
 */
export function createNanoLlm() {
  return new ChatOpenAI({
    model: 'gpt-4.1-nano',
    temperature: 0,
  });
}
