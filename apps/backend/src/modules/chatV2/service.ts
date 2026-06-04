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

// ── Conversation helpers (also used by the preview route) ────────────────────

/**
 * For WA / Slack: find by externalId or create.
 * For web preview: find by id or create with conversationId as the row ID.
 */
async function findOrCreateByExternalId({
  channelId,
  agentId,
  externalId,
  firstUserMessage,
}: {
  channelId: string;
  agentId: string;
  externalId: string;
  firstUserMessage: string;
}): Promise<{ conversationId: string }> {
  const existing = await ConversationService.findByExternalId({ channelId, externalId });
  if (existing) return { conversationId: existing.id };

  const created = await ConversationService.create({
    id: crypto.randomUUID(),
    agentId,
    channelId,
    externalId,
    lastUserQuestion: firstUserMessage,
    lastAssistantUtterance: '',
    lastMessageAt: new Date(),
  });

  if (!created) throw new V2NotFoundError('Failed to create conversation');
  return { conversationId: created.id };
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
   * Used by the preview and web routes.
   * The client sends its own session key (nanoid / useId format) as conversationId.
   * We store that as externalId and generate a UUID for the DB id so LangGraph
   * can use it directly as thread_id.
   */
  static async findOrCreate({
    channelId,
    agentId,
    conversationId: clientSessionId,
    orgId,
    firstUserMessage,
  }: {
    channelId: string;
    agentId: string;
    conversationId: string;
    orgId: string;
    firstUserMessage: string;
  }): Promise<{ conversationId: string }> {
    const existing = await ConversationService.findByExternalId({
      channelId,
      externalId: clientSessionId,
    });
    if (existing) return { conversationId: existing.id };

    const created = await ConversationService.create({
      id: crypto.randomUUID(),
      agentId,
      channelId,
      externalId: clientSessionId,
      lastUserQuestion: firstUserMessage,
      lastAssistantUtterance: '',
      lastMessageAt: new Date(),
    });
    if (!created) throw new V2NotFoundError('Failed to create conversation');
    return { conversationId: created.id };
  }

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
    await client.threads.create({ threadId: conversationId, ifExists: 'do_nothing' });
    const result = await client.runs.wait(conversationId, 'agent', {
      input: { messages: [{ role: 'human', content: message }] },
      config: { configurable: { agentId, channelId, orgId, ip } },
      multitaskStrategy: 'interrupt',
    });
    // OutputState has { messages: [...] } — last entry is the assistant response
    const msgs = (result as { messages?: Array<{ type?: string; content?: string }> }).messages ?? [];
    const last = msgs.at(-1);
    return typeof last?.content === 'string' ? last.content : '';
  }

  /**
   * Streaming invoke — used by both the web channel and the dashboard preview.
   *
   * Uses streamMode:'messages' for true token-level deltas and emits the AI SDK
   * UI message stream format so useChat can parse it directly.
   *
   * The graph makes 3 LLM calls in order:
   *   1. extractEntities  (nano, JSON output)
   *   2. generateRagResponse  (main model — the real answer we stream)
   *   3. scoreSentiment  (nano, JSON output)
   * messages/metadata marks each call start; we target the second one.
   * messages/partial content is cumulative — we compute deltas.
   *
   * onFinish fires after [DONE] so callers can trigger usage tracking and
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
    await client.threads.create({ threadId: conversationId, ifExists: 'do_nothing' });

    const lgStream = client.runs.stream(conversationId, 'agent', {
      input: { messages: [{ role: 'human', content: message }] },
      config: { configurable: { agentId, channelId, orgId, ip } },
      streamMode: 'messages',
      multitaskStrategy: 'interrupt',
    });

    const msgId = crypto.randomUUID();
    const encoder = new TextEncoder();
    const sse = (data: object | string) =>
      encoder.encode(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);

    return new ReadableStream({
      async start(controller) {
        try {
          let llmCallIndex = 0;
          let targetId: string | null = null;
          let prevContent = '';
          let started = false;

          for await (const chunk of lgStream) {
            if (chunk.event === 'messages/metadata') {
              llmCallIndex++;
              if (llmCallIndex === 2) {
                targetId = Object.keys(chunk.data as Record<string, unknown>)[0] ?? null;
                prevContent = '';
              }
              continue;
            }

            if (chunk.event !== 'messages/partial' || !targetId) continue;

            const msg = (Array.isArray(chunk.data) ? chunk.data[0] : chunk.data) as {
              id?: string;
              content?: string;
            } | null;

            if (msg?.id !== targetId || typeof msg.content !== 'string') continue;

            const delta = msg.content.slice(prevContent.length);
            prevContent = msg.content;
            if (delta) {
              if (!started) {
                controller.enqueue(sse({ type: 'start' }));
                controller.enqueue(sse({ type: 'start-step' }));
                controller.enqueue(sse({ type: 'text-start', id: msgId }));
                started = true;
              }
              controller.enqueue(sse({ type: 'text-delta', id: msgId, delta }));
            }
          }

          controller.enqueue(sse({ type: 'text-end', id: msgId }));
          controller.enqueue(sse({ type: 'finish-step' }));
          controller.enqueue(sse({ type: 'finish', finishReason: 'stop' }));
          controller.enqueue(sse('[DONE]'));
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

    const { conversationId: resolvedId } = await ChatV2Service.findOrCreate({
      channelId,
      agentId: channel.agentId,
      conversationId,
      orgId: channel.orgId,
      firstUserMessage: message,
    });

    const plan = await SubscriptionService.getPlan(channel.orgId);

    return ChatV2Service.stream({
      agentId: channel.agentId,
      conversationId: resolvedId,
      channelId,
      orgId: channel.orgId,
      message,
      ip,
      onFinish: () => {
        void OrgUsageMonthlyService.incrementAssistantMessages(channel.orgId);
        if (plan !== 'free') {
          void enrichConversationAsync({ conversationId: resolvedId, ip });
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

    const { conversationId } = await findOrCreateByExternalId({
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

    const { conversationId } = await findOrCreateByExternalId({
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
