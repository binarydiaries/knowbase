/**
 * ChatV2Service — backend gateway for LangGraph-powered chat.
 *
 * Responsibility split:
 *   Backend (here):
 *     - Channel validation, domain check, message limits
 *     - Find-or-create conversation row (needed to satisfy FK before calling LangGraph)
 *     - Call orchestration (stream or invoke)
 *     - Usage tracking (OrgUsageMonthlyService) after graph completes
 *     - Fire-and-forget enrichment (country, topic) on paid plans
 *
 *   Orchestration (persistTurn node):
 *     - All conversation field updates (lastUserQuestion, lastAssistantUtterance, entities)
 *     - All message inserts with full metadata (finalQuery, RAG sources, sentiment)
 */

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
 * Find an existing conversation by externalId or create a bare placeholder row.
 * Returns { conversationId, isNew }.
 *
 * The row is intentionally sparse — persistTurn owns all subsequent field writes.
 * lastUserQuestion / lastAssistantUtterance are required NOT NULL, so we seed them
 * with the first user message and an empty string respectively.
 */
async function findOrCreateConversation({
  channelId,
  agentId,
  externalId,
  firstUserMessage,
}: {
  channelId: string;
  agentId: string;
  externalId: string;
  firstUserMessage: string;
}): Promise<{ conversationId: string; isNew: boolean }> {
  const existing = await ConversationService.findByExternalId({ channelId, externalId });
  if (existing) return { conversationId: existing.id, isNew: false };

  const created = await ConversationService.create({
    id: createId(),
    agentId,
    channelId,
    externalId,
    lastUserQuestion: firstUserMessage,
    lastAssistantUtterance: '',
    lastMessageAt: new Date(),
  });

  if (!created) throw new V2NotFoundError('Failed to create conversation');
  return { conversationId: created.id, isNew: true };
}

/**
 * Fire-and-forget: attach country (IP geo lookup) to a conversation.
 * Topic labelling is handled inside the orchestration's persistTurn node.
 * Only called on paid plans.
 */
async function enrichConversationAsync({
  conversationId,
  ip,
}: {
  conversationId: string;
  ip?: string;
}): Promise<void> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return;
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

// ── Service ───────────────────────────────────────────────────────────────────

export abstract class ChatV2Service {
  /**
   * Non-streaming invoke — used by WhatsApp and Slack.
   * Awaits graph completion (including persistTurn) before returning.
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
   * onFinish fires after the graph completes (after [DONE]) so callers can
   * trigger usage and enrichment at the correct time without buffering the stream.
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

    // Web: conversationId is client-generated. Look up to determine isNew.
    const existing = await ConversationService.single({ id: conversationId, orgId: channel.orgId });
    const isExisting = existing?.channelId === channelId;

    if (!isExisting) {
      await ConversationService.create({
        id: conversationId,
        agentId: channel.agentId,
        channelId,
        lastUserQuestion: message,
        lastAssistantUtterance: '',
        lastMessageAt: new Date(),
      });
    }

    const isNew = !isExisting;
    const plan = await SubscriptionService.getPlan(channel.orgId);

    return ChatV2Service.stream({
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId: channel.orgId,
      message,
      ip,
      onFinish: () => {
        void OrgUsageMonthlyService.incrementAssistantMessages(channel.orgId);
        if (plan !== 'free') {
          void enrichConversationAsync({ conversationId, ip });
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

    const waBase = `https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`;
    const waHeaders = {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
    };

    // Read receipt + typing indicator — fire-and-forget
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

    const { conversationId, isNew } = await findOrCreateConversation({
      channelId,
      agentId: channel.agentId,
      externalId: senderPhone,
      firstUserMessage: message,
    });

    // invoke waits for graph completion — persistTurn has run by the time this returns
    const response = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId,
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
        text: { body: response },
      }),
    });

    void OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    const plan = await SubscriptionService.getPlan(orgId);
    if (plan !== 'free') {
      void enrichConversationAsync({ conversationId, ip });
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

    const { conversationId, isNew } = await findOrCreateConversation({
      channelId,
      agentId: channel.agentId,
      externalId: threadTs,
      firstUserMessage: message,
    });

    const response = await ChatV2Service.invoke({
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId,
      message,
      ip,
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

    void OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    const plan = await SubscriptionService.getPlan(orgId);
    if (plan !== 'free') {
      void enrichConversationAsync({ conversationId, ip });
    }
  }
}
