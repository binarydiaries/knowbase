import { Client } from '@langchain/langgraph-sdk';
import { createId } from '@paralleldrive/cuid2';
import type { IChannelSlackConfig, IChannelWebConfig, IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ConversationService } from '../conversation/service';
import { SlackConnectionService } from '../slack/connectionService';
import { SubscriptionService } from '../subscription/service';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';

// ── Errors ────────────────────────────────────────────────────────────────────

export class V2NotFoundError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'V2NotFoundError';
  }
}

export class V2ForbiddenError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'V2ForbiddenError';
  }
}

export class V2LimitError extends Error {
  constructor(
    msg: string,
    readonly payload: { plan: string; messagesPerMonthLimit: number; messagesThisMonth: number },
  ) {
    super(msg);
    this.name = 'V2LimitError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isDomainAllowed(origin: string | undefined, allowedDomains: string[]): boolean {
  if (!allowedDomains.length) return true;
  if (!origin) return false;
  try {
    return allowedDomains.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function getClient(): Client {
  return new Client({ apiUrl: process.env.ORCHESTRATION_URL ?? 'http://localhost:2024' });
}

// ── Service ───────────────────────────────────────────────────────────────────

export abstract class ChatV2Service {
  static async invoke({
    agentId,
    conversationId,
    channelId,
    orgId,
    message,
    ip,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
    message: string;
    ip?: string;
  }): Promise<string> {
    const client = getClient();

    const result = await client.runs.wait(conversationId, 'agent', {
      input: { messages: [{ role: 'human', content: message }] },
      config: { configurable: { agentId, channelId, orgId, ip } },
    });

    return (result as { response?: string }).response ?? '';
  }

  static async stream({
    agentId,
    conversationId,
    channelId,
    orgId,
    message,
    ip,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
    message: string;
    ip?: string;
  }): Promise<ReadableStream> {
    const client = getClient();

    const stream = client.runs.stream(conversationId, 'agent', {
      input: { messages: [{ role: 'human', content: message }] },
      config: { configurable: { agentId, channelId, orgId, ip } },
      streamMode: 'values',
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const state = chunk.data as { response?: string };
            if (state?.response) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text', text: state.response })}\n\n`,
                ),
              );
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  static async sendWeb({
    message,
    channelId,
    conversationId,
    parentOrigin,
    ip,
  }: {
    message: string;
    channelId: string;
    conversationId: string;
    parentOrigin?: string;
    ip?: string;
  }): Promise<ReadableStream> {
    const channel = await ChannelService.singleById(channelId);
    if (!channel) throw new V2NotFoundError('Channel not found');

    if (channel.type === 'web') {
      const cfg = channel.config as IChannelWebConfig;
      if (!isDomainAllowed(parentOrigin, cfg.allowedDomains ?? [])) {
        throw new V2ForbiddenError('Domain not allowed');
      }
    }

    const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(channel.orgId);
    if (!limit.allowed) {
      throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), {
        plan: limit.plan,
        messagesPerMonthLimit: limit.messagesPerMonthLimit,
        messagesThisMonth: limit.messagesThisMonth,
      });
    }

    return ChatV2Service.stream({
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId: channel.orgId,
      message,
      ip,
    });
  }

  static async sendWhatsApp({
    channelId,
    orgId,
    senderPhone,
    message,
    messageId,
  }: {
    channelId: string;
    orgId: string;
    senderPhone: string;
    message: string;
    messageId?: string;
  }): Promise<void> {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'whatsapp') throw new V2NotFoundError('WhatsApp channel not found');

    const cfg = channel.config as IChannelWhatsAppConfig;
    if (!cfg.phoneNumberId) throw new V2NotFoundError('WhatsApp channel not configured');

    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) throw new V2NotFoundError('WhatsApp not connected');

    const waHeaders = {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
    };
    const waBase = `https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`;

    if (messageId) {
      fetch(waBase, {
        method: 'POST',
        headers: waHeaders,
        body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
      }).catch(() => {});
    }

    fetch(waBase, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: senderPhone,
        type: 'typing_indicator',
        typing_indicator: { type: 'text' },
      }),
    }).catch(() => {});

    const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!limit.allowed) {
      throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), {
        plan: limit.plan,
        messagesPerMonthLimit: limit.messagesPerMonthLimit,
        messagesThisMonth: limit.messagesThisMonth,
      });
    }

    let conversation = await ConversationService.findByExternalId({ channelId, externalId: senderPhone });
    if (!conversation) {
      conversation = await ConversationService.create({
        id: createId(),
        agentId: channel.agentId,
        channelId,
        externalId: senderPhone,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      });
    }

    const response = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId: conversation.id,
      channelId,
      orgId,
      message,
    });

    await fetch(waBase, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: senderPhone,
        type: 'text',
        text: { body: response },
      }),
    });
  }

  static async sendSlack({
    channelId,
    orgId,
    message,
    slackChannelId,
    threadTs,
  }: {
    channelId: string;
    orgId: string;
    message: string;
    slackChannelId: string;
    threadTs: string;
  }): Promise<void> {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'slack') throw new V2NotFoundError('Slack channel not found');

    const cfg = channel.config as IChannelSlackConfig;
    if (!cfg.slackChannelId) throw new V2NotFoundError('Slack channel not configured');

    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) throw new V2NotFoundError('Slack not connected');

    const slackHeaders = {
      Authorization: `Bearer ${connection.botToken}`,
      'Content-Type': 'application/json',
    };

    let placeholderTs: string | null = null;
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, text: '_Thinking…_', thread_ts: threadTs }),
      });
      const data = (await res.json()) as { ok: boolean; ts?: string };
      if (data.ok && data.ts) placeholderTs = data.ts;
    } catch {}

    const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!limit.allowed) {
      throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), {
        plan: limit.plan,
        messagesPerMonthLimit: limit.messagesPerMonthLimit,
        messagesThisMonth: limit.messagesThisMonth,
      });
    }

    let conversation = await ConversationService.findByExternalId({ channelId, externalId: threadTs });
    if (!conversation) {
      conversation = await ConversationService.create({
        id: createId(),
        agentId: channel.agentId,
        channelId,
        externalId: threadTs,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      });
    }

    const response = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId: conversation.id,
      channelId,
      orgId,
      message,
    });

    if (placeholderTs) {
      fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, ts: placeholderTs, text: response }),
      }).catch(() => {});
    } else {
      fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, text: response, thread_ts: threadTs }),
      }).catch(() => {});
    }
  }
}
