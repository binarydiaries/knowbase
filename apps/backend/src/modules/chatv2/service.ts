import { toUIMessageStream } from '@ai-sdk/langchain';
import { HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import type { IChannelWebConfig, IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { SubscriptionService } from '../subscription/service';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';
import { graph } from '../graph/graph';
import { AIMessage } from '@langchain/core/messages';
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

  static async sendWhatsApp({
    channelId,
    orgId,
    senderPhone,
    message,
    messageId,
    ip,
  }: {
    channelId: string;
    orgId: string;
    senderPhone: string;
    message: string;
    messageId?: string;
    ip?: string;
  }) {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'whatsapp') {
      throw new NotFoundError('WhatsApp channel not found');
    }
    const config = channel.config as IChannelWhatsAppConfig;
    if (!config.phoneNumberId) {
      throw new NotFoundError('WhatsApp channel not configured');
    }

    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) {
      throw new NotFoundError('WhatsApp not connected for this org');
    }

    // senderPhone is stable across all messages from the same user — use it
    // directly as thread_id. The checkpointer tracks continuity; initConversation
    // creates the DB record on the first turn and updates on subsequent ones.
    const thread_id = senderPhone;

    const { isPaid } = await ChatV2Service.assertMessageLimit(orgId);

    const waHeaders = {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
    };
    const waUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

    // ── Seen receipt (blue ticks) ─────────────────────────────────────────
    if (messageId) {
      fetch(waUrl, {
        method: 'POST',
        headers: waHeaders,
        body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
      }).catch((e) => console.error('[WA seen] error:', e));
    }

    // ── Typing indicator ──────────────────────────────────────────────────
    fetch(waUrl, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: senderPhone,
        type: 'typing_indicator',
        typing_indicator: { type: 'text' },
      }),
    }).catch((e) => console.error('[WA typing] error:', e));

    // ── Invoke graph ──────────────────────────────────────────────────────
    const finalState = await graph.invoke(
      { messages: new HumanMessage(message) },
      {
        configurable: {
          agentId: channel.agentId,
          orgId,
          channelId,
          thread_id,
          isPaid,
          ip,
        },
      },
    );

    const lastAI = [...finalState.messages].reverse().find((m) => AIMessage.isInstance(m));
    const assistantText = typeof lastAI?.content === 'string' ? lastAI.content : '';

    // ── Send reply ────────────────────────────────────────────────────────
    await fetch(waUrl, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: senderPhone,
        type: 'text',
        text: { body: assistantText },
      }),
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
