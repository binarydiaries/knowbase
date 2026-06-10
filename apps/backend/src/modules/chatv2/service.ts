import { toUIMessageStream } from '@ai-sdk/langchain';
import { HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import type { IChannelWebConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { SubscriptionService } from '../subscription/service';
import { graph } from '../graph/graph';
import { suppressPipelineNodes } from '../graph/utils/stream';

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
  constructor(
    message: string,
    readonly payload: Awaited<
      ReturnType<typeof SubscriptionService.assertMessagesPerMonthLimitNotReached>
    >,
  ) {
    super(message);
    this.name = 'MessageLimitReachedError';
  }
}

export abstract class ChatV2Service {
  /**
   * Asserts the org hasn't hit their monthly message limit.
   * Returns isPaid so callers can pass it to the graph config without a second query.
   */
  static async assertMessageLimit(orgId: string): Promise<{ isPaid: boolean }> {
    const result = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!result.allowed) {
      throw new MessageLimitReachedError(
        SubscriptionService.getMessageLimitReachedMessage(result),
        result,
      );
    }
    return { isPaid: result.plan !== 'free' };
  }

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

    const { orgId, agentId } = channel;
    const { isPaid } = await ChatV2Service.assertMessageLimit(orgId);

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(
        suppressPipelineNodes(
          graph.streamEvents(
            { messages: new HumanMessage(message) },
            {
              version: 'v2',
              configurable: { agentId, orgId, channelId, thread_id: conversationId, isPaid, ip },
            },
          ),
        ),
      ),
    });
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
    const { isPaid } = await ChatV2Service.assertMessageLimit(orgId);

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(
        suppressPipelineNodes(
          graph.streamEvents(
            { messages: new HumanMessage(message) },
            {
              version: 'v2',
              configurable: { agentId, orgId, channelId, thread_id: conversationId, isPaid },
            },
          ),
        ),
      ),
    });
  }
}
