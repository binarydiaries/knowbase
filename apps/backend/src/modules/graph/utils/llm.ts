import type { RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { logger } from '../../../utils/logger.utils';
import { createCostCallback } from './cost';

const log = logger.child({ module: 'graph', util: 'llm' });

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Extract cost context from LangGraph config and build the callbacks array.
 * Returns undefined (no-op) when orgId is absent so tests work without config.
 */
function costCallbacks(
  modelName: string,
  config?: RunnableConfig | null,
  nodeName?: string,
) {
  const { orgId, agentId, thread_id } = config?.configurable ?? {};
  if (!orgId) return undefined;
  return [
    createCostCallback({
      orgId,
      agentId,
      conversationId: thread_id,
      modelName,
      nodeName,
    }),
  ];
}

/**
 * Main model for RAG response generation — streaming enabled so that tokens
 * are forwarded to the client in real-time via LangGraph streamMode:'messages'.
 * Falls back to OpenAI when provider is unrecognised.
 *
 * Pass `config` (from the graph node's second argument) to automatically
 * record token usage. Pass `nodeName` to tag the event in the DB.
 */
export function createLlm(
  provider: string = 'openai',
  modelName?: string,
  config?: RunnableConfig | null,
  nodeName?: string,
) {
  const model = modelName ?? 'gpt-4.1-mini';
  switch (provider) {
    case 'anthropic':
    case 'gemini':
      // Future providers — fall back to OpenAI until adapters are added
      log.warn(
        { provider },
        'provider not yet supported, falling back to openai',
      );
      return new ChatOpenAI({
        model,
        temperature: 0.3,
        streaming: true,
        callbacks: costCallbacks(model, config, nodeName),
      });
    default:
      return new ChatOpenAI({
        model,
        temperature: 0.3,
        streaming: true,
        callbacks: costCallbacks(model, config, nodeName),
      });
  }
}

/**
 * Nano model for user-facing short responses (e.g. collectMissingData).
 * Streaming enabled so the response reaches the client via the messages stream.
 *
 * Pass `config` + `nodeName` to automatically record token usage.
 */
export function createStreamingNanoLlm(
  config?: RunnableConfig | null,
  nodeName?: string,
) {
  const model = 'gpt-4.1-nano';
  return new ChatOpenAI({
    model,
    temperature: 0,
    streaming: true,
    callbacks: costCallbacks(model, config, nodeName),
  });
}

/**
 * Nano model for internal utility calls (entity extraction, intent detection,
 * query rewriting). NOT streaming — these results must not leak to the client.
 *
 * Pass `config` + `nodeName` to automatically record token usage.
 */
export function createNanoLlm(
  config?: RunnableConfig | null,
  nodeName?: string,
) {
  const model = 'gpt-4.1-nano';
  return new ChatOpenAI({
    model,
    temperature: 0,
    callbacks: costCallbacks(model, config, nodeName),
  });
}
