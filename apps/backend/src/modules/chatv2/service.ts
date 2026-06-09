import { toUIMessageStream } from '@ai-sdk/langchain';
import { HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import type { IChannelWebConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { graph } from '../graph/graph';

/**
 * streamEvents v2 forces ALL LLM calls to stream, including internal pipeline
 * nodes.  We block on_chat_model_stream events from nodes whose output must
 * not reach the client.  Blocklist (not allowlist) so future nodes default to
 * passing through.
 *
 * Node map (from reading both subgraph files):
 *   main graph    : loadAgent · extractEntities · detectIntent · ragGraph · workflowGraph
 *   ragGraph      : rewriteQuery · vectorSearch · generateResponse  ← streams to client
 *   workflowGraph : loadWorkflow · checkRequirements · collectMissingData · executeActions
 */
const PIPELINE_NODES = new Set([
  'extractEntities', // main graph — structured JSON, must not reach client
  'detectIntent',    // main graph — structured JSON, must not reach client
  'rewriteQuery',    // inside ragGraph — internal text rewrite, not user-visible
]);

// biome-ignore lint/suspicious/noExplicitAny: streamEvents yields untyped events
type StreamEvent = any;

async function* suppressPipelineNodes(
  stream: AsyncIterable<StreamEvent>,
): AsyncIterable<StreamEvent> {
  for await (const event of stream) {
    if (event.event === 'on_chat_model_stream') {
      const node = event.metadata?.langgraph_node as string | undefined;
      if (node && PIPELINE_NODES.has(node)) continue;
    }

    // executeActions doesn't call an LLM — it constructs an AIMessage directly,
    // so no on_chat_model_stream event ever fires for it.  Intercept the
    // on_chain_end for that node and synthesise a fake streaming event so the
    // success/failure message reaches the client.
    if (
      event.event === 'on_chain_end' &&
      event.metadata?.langgraph_node === 'executeActions'
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: untyped LangGraph output
      const msgs: any[] = event.data?.output?.messages ?? [];
      for (const msg of msgs) {
        const text =
          typeof msg?.content === 'string' ? msg.content.trim() : '';
        if (text) {
          yield {
            event: 'on_chat_model_stream',
            run_id: event.run_id,
            name: 'executeActions',
            data: {
              chunk: {
                content: text,
                id: `execute-${event.run_id}`,
              },
            },
            metadata: {
              ...event.metadata,
              langgraph_node: 'executeActions',
            },
          };
        }
      }
      continue; // don't forward the raw on_chain_end
    }

    yield event;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DomainNotAllowedError extends Error {
  constructor() {
    super('Domain not allowed');
    this.name = 'DomainNotAllowedError';
  }
}

export class MessageLimitReachedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageLimitReachedError';
  }
}

export abstract class ChatV2Service {
  static async sendWeb({
    channelId,
    conversationId,
    message,
    parentOrigin,
    ip,
  }: {
    channelId: string;
    message: string;
    conversationId: string;
    parentOrigin?: string;
    ip?: string;
  }): Promise<Response> {
    const channel = await ChannelService.singleById(channelId);

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.type === 'web') {
      const config = channel.config as IChannelWebConfig;
      const allowedDomains = config.allowedDomains ?? [];
      if (allowedDomains.length > 0) {
        let allowed = false;
        if (parentOrigin) {
          try {
            allowed = allowedDomains.includes(new URL(parentOrigin).hostname);
          } catch {
            allowed = false;
          }
        }
        if (!allowed) throw new DomainNotAllowedError();
      }
    }

    // TODO: wire up LangGraph pipeline here
    throw new Error('Not implemented');
  }

  static async sendPreview({
    agentId,
    conversationId,
    channelId,
    message,
    orgId,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    message: string;
    orgId: string;
  }) {
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(
        suppressPipelineNodes(
          graph.streamEvents(
            { messages: new HumanMessage(message) },
            {
              version: 'v2',
              configurable: { agentId, orgId, channelId, thread_id: conversationId },
            },
          ),
        ),
      ),
    });
  }
}
