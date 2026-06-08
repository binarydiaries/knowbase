import { toUIMessageStream } from '@ai-sdk/langchain';
import { HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import type { IChannelWebConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { graph } from '../graph/graph';

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
    // streamEvents v2 emits fine-grained LangChain lifecycle events.
    // toUIMessageStream only emits text from `on_chat_model_stream` events.
    // Non-streaming utility LLMs (extractEntities, detectIntent) never fire
    // `on_chat_model_stream` — they only fire `on_chat_model_end` which
    // toUIMessageStream ignores — so their JSON output never reaches the client.
    // No filtering code required.
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(
        graph.streamEvents(
          { messages: new HumanMessage(message) },
          {
            version: 'v2',
            configurable: { agentId, orgId, channelId, thread_id: conversationId },
          },
        ),
      ),
    });
  }
}
