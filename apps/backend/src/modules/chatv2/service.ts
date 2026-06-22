import { toUIMessageStream } from '@ai-sdk/langchain';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import type { IChannelSlackConfig, IChannelWebConfig, IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { SubscriptionService } from '../subscription/service';
import { SlackConnectionService } from '../slack/connectionService';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';
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

  static async sendSlack({
    channelId,
    orgId,
    message,
    slackChannelId,
    threadTs,
    ip,
  }: {
    channelId: string;
    orgId: string;
    message: string;
    slackChannelId: string;
    threadTs: string;
    ip?: string;
  }) {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'slack') {
      throw new NotFoundError('Slack channel not found');
    }
    const config = channel.config as IChannelSlackConfig;
    if (!config.slackChannelId) {
      throw new NotFoundError('Slack channel not configured');
    }

    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) {
      throw new NotFoundError('Slack not connected for this org');
    }

    // threadTs is stable per Slack thread — use as thread_id directly
    const thread_id = threadTs;
    console.log('[DEBUG sendSlack] thread_id=%s message=%s', thread_id, message.slice(0, 80));

    const { isPaid } = await ChatV2Service.assertMessageLimit(orgId);

    const slackHeaders = {
      Authorization: `Bearer ${connection.botToken}`,
      'Content-Type': 'application/json',
    };

    // ── Thinking placeholder ──────────────────────────────────────────────
    let placeholderTs: string | null = null;
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, text: '_Thinking…_', thread_ts: threadTs }),
      });
      const data = (await res.json()) as { ok: boolean; ts?: string; error?: string };
      console.log('[DEBUG sendSlack] thinking placeholder:', data.ok ? `posted ts=${data.ts}` : `failed error=${data.error}`);
      if (data.ok && data.ts) placeholderTs = data.ts;
    } catch (e) {
      console.error('[DEBUG sendSlack] thinking placeholder exception:', e);
    }

    // ── Invoke graph ──────────────────────────────────────────────────────
    console.log('[DEBUG sendSlack] invoking graph agentId=%s', channel.agentId);
    let assistantText = '';
    try {
      const finalState = await graph.invoke(
        { messages: new HumanMessage(message) },
        {
          configurable: { agentId: channel.agentId, orgId, channelId, thread_id, isPaid, ip },
        },
      );
      const lastAI = [...finalState.messages].reverse().find((m) => AIMessage.isInstance(m));
      assistantText = typeof lastAI?.content === 'string' ? lastAI.content : '';
      console.log('[DEBUG sendSlack] graph done assistantText=%s', assistantText.slice(0, 120));
    } catch (err) {
      console.error('[DEBUG sendSlack] graph.invoke failed:', err);
      assistantText = 'Sorry, something went wrong. Please try again.';
    }

    // ── Update placeholder or post new message ────────────────────────────
    if (placeholderTs) {
      const updateRes = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, ts: placeholderTs, text: assistantText }),
      });
      const updateData = (await updateRes.json()) as { ok: boolean; error?: string };
      console.log('[DEBUG sendSlack] chat.update:', updateData.ok ? 'ok' : `failed error=${updateData.error}`);
    } else {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, text: assistantText, thread_ts: threadTs }),
      });
    }
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
