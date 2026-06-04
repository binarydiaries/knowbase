import { Client } from '@langchain/langgraph-sdk';
import { createId } from '@paralleldrive/cuid2';
import type { IChannelSlackConfig, IChannelWebConfig, IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ConversationService } from '../conversation/service';
import { SlackConnectionService } from '../slack/connectionService';
import { SubscriptionService } from '../subscription/service';
import { OrgUsageMonthlyService } from '../subscription/usage';
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

// ── Private helpers ───────────────────────────────────────────────────────────

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

/**
 * Fire-and-forget: attach country (IP geo lookup) and topic (AI label) to a
 * conversation. Mirrors v1 enrichConversationAsync. Only runs on paid plans.
 */
async function enrichConversationAsync({
  conversationId,
  firstUserMessage,
  isNew,
  ip,
}: {
  conversationId: string;
  firstUserMessage: string;
  isNew: boolean;
  ip?: string;
}): Promise<void> {
  try {
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
        if (geoRes.ok) {
          const geo = (await geoRes.json()) as { countryCode?: string };
          if (geo.countryCode) {
            await ConversationService.update(conversationId, { country: geo.countryCode });
          }
        }
      } catch {
        // Geo lookup is best-effort
      }
    }

    // Topic labelling (isNew only) is handled inside the orchestration's persistTurn node
    // once cost tracking is wired. Nothing to do here for now.
  } catch {
    // Enrichment is always best-effort
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export abstract class ChatV2Service {
  /**
   * Non-streaming invoke — used by WhatsApp and Slack.
   * Awaits graph completion and returns the assistant text.
   */
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

  /**
   * Streaming invoke — used by the web channel.
   * Accepts an optional onFinish callback that fires once the graph completes
   * (after the [DONE] sentinel), so callers can trigger usage tracking and
   * enrichment at the right time without buffering the stream.
   */
  static async stream({
    agentId,
    conversationId,
    channelId,
    orgId,
    message,
    ip,
    onFinish,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
    message: string;
    ip?: string;
    onFinish?: () => void;
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
          onFinish?.();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  // ── Web ───────────────────────────────────────────────────────────────────

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

    // Resolve existing conversation — discard if it belongs to a different channel
    // (same client-generated ID reused across agents in the same org).
    const rawConversation = await ConversationService.single({ id: conversationId, orgId: channel.orgId });
    const existing = rawConversation?.channelId === channelId ? rawConversation : undefined;
    const isNew = !existing;

    if (isNew) {
      await ConversationService.create({
        id: conversationId,
        agentId: channel.agentId,
        channelId,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      });
    }

    const plan = await SubscriptionService.getPlan(channel.orgId);

    return ChatV2Service.stream({
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId: channel.orgId,
      message,
      ip,
      onFinish: () => {
        // Fire-and-forget post-stream tasks — mirror v1 onFinish behaviour
        void OrgUsageMonthlyService.incrementAssistantMessages(channel.orgId);
        if (plan !== 'free') {
          void enrichConversationAsync({ conversationId, firstUserMessage: message, isNew, ip });
        }
      },
    });
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

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

    // Read receipt (blue ticks)
    if (messageId) {
      fetch(waBase, {
        method: 'POST',
        headers: waHeaders,
        body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
      }).catch(() => {});
    }

    // Typing indicator
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

    const existing = await ConversationService.findByExternalId({ channelId, externalId: senderPhone });
    const isNew = !existing;
    const conversation =
      existing ??
      (await ConversationService.create({
        id: createId(),
        agentId: channel.agentId,
        channelId,
        externalId: senderPhone,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      }));
    if (!conversation) throw new V2NotFoundError('Failed to resolve conversation');

    // invoke awaits graph completion — persistTurn has already run by the time we return
    const assistantText = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId: conversation.id,
      channelId,
      orgId,
      message,
      ip,
    });

    await fetch(waBase, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: senderPhone,
        type: 'text',
        text: { body: assistantText },
      }),
    });

    await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    const plan = await SubscriptionService.getPlan(orgId);
    if (plan !== 'free') {
      void enrichConversationAsync({
        conversationId: conversation.id,
        firstUserMessage: message,
        isNew,
        ip,
      });
    }
  }

  // ── Slack ─────────────────────────────────────────────────────────────────

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

    // Post "Thinking…" placeholder before LLM call
    let placeholderTs: string | null = null;
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({ channel: slackChannelId, text: '_Thinking…_', thread_ts: threadTs }),
      });
      const data = (await res.json()) as { ok: boolean; ts?: string };
      if (data.ok && data.ts) placeholderTs = data.ts;
    } catch {
      // Best-effort — proceed even if placeholder fails
    }

    const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!limit.allowed) {
      throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), {
        plan: limit.plan,
        messagesPerMonthLimit: limit.messagesPerMonthLimit,
        messagesThisMonth: limit.messagesThisMonth,
      });
    }

    const existing = await ConversationService.findByExternalId({ channelId, externalId: threadTs });
    const isNew = !existing;
    const conversation =
      existing ??
      (await ConversationService.create({
        id: createId(),
        agentId: channel.agentId,
        channelId,
        externalId: threadTs,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      }));
    if (!conversation) throw new V2NotFoundError('Failed to resolve conversation');

    const response = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId: conversation.id,
      channelId,
      orgId,
      message,
      ip,
    });

    // Update placeholder or post new message
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

    await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    const plan = await SubscriptionService.getPlan(orgId);
    if (plan !== 'free') {
      void enrichConversationAsync({
        conversationId: conversation.id,
        firstUserMessage: message,
        isNew,
        ip,
      });
    }
  }
}
