/**
 * ChatV2Service — backend gateway for LangGraph-powered chat.
 *
 * Responsibility split:
 *   Backend (here):
 *     - Channel validation, domain check, agent status check, message limits
 *     - Find-or-create conversation row (needed to satisfy FK before calling LangGraph)
 *     - Call orchestration (stream or invoke)
 *     - Usage tracking (OrgUsageMonthlyService) after graph completes
 *     - Fire-and-forget enrichment (country, topic) on paid plans
 *
 *   Orchestration (persistTurn node):
 *     - All conversation field updates (lastUserQuestion, lastAssistantUtterance, entities)
 *     - All message inserts with full metadata (finalQuery, RAG sources, sentiment)
 */

import { openai } from '@ai-sdk/openai';
import { Client } from '@langchain/langgraph-sdk';
import { generateText } from 'ai';
import { isDomainAllowed } from '../../utils/domain.utils';
import { AgentService } from '../agent/service';
import type {
  IChannelSlackConfig,
  IChannelWebConfig,
  IChannelWhatsAppConfig,
} from '../channel/model';
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
    readonly payload: {
      plan: string;
      messagesPerMonthLimit: number;
      messagesThisMonth: number;
    },
  ) {
    super(msg);
    this.name = 'V2LimitError';
  }
}

export class V2OrchestrationError extends Error {
  constructor(
    msg = 'Sorry, the AI assistant is temporarily unavailable. Please try again in a moment.',
  ) {
    super(msg);
    this.name = 'V2OrchestrationError';
  }
}

// ── LangGraph client (singleton) ──────────────────────────────────────────────

const client = new Client({
  apiUrl: process.env.ORCHESTRATION_URL ?? 'http://localhost:2024',
});

// ── Nano LLM for topic labeling ───────────────────────────────────────────────

const nanoModel = openai('gpt-4.1-nano');

// ── Guards ────────────────────────────────────────────────────────────────────

async function assertAgentActive(
  agentId: string,
  orgId: string,
): Promise<void> {
  const agent = await AgentService.single({ id: agentId, orgId });
  if (!agent || agent.agentStatus !== 'active') {
    throw new V2NotFoundError('Agent not found or inactive');
  }
}

// ── Conversation helpers ──────────────────────────────────────────────────────

/**
 * For WA / Slack: find by externalId or create.
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
}): Promise<{ conversationId: string; isNew: boolean }> {
  const existing = await ConversationService.findByExternalId({
    channelId,
    externalId,
  });
  if (existing) return { conversationId: existing.id, isNew: false };

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
  return { conversationId: created.id, isNew: true };
}

/**
 * Fire-and-forget: attach country (IP geo lookup) and topic label to a conversation.
 * Topic label is only generated for new conversations. Paid plans only.
 */
async function enrichConversationAsync({
  conversationId,
  ip,
  isNew,
  firstUserMessage,
}: {
  conversationId: string;
  ip?: string;
  isNew: boolean;
  firstUserMessage: string;
}): Promise<void> {
  if (ip && ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const geoRes = await fetch(
        `http://ip-api.com/json/${ip}?fields=countryCode`,
      );
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as { countryCode?: string };
        if (geo.countryCode) {
          await ConversationService.update(conversationId, {
            country: geo.countryCode,
          });
        }
      }
    } catch {
      // Geo lookup is best-effort
    }
  }

  if (isNew) {
    try {
      const result = await generateText({
        model: nanoModel,
        prompt: `In 2-5 words, what topic is this question about? Reply with ONLY the topic label, nothing else.\n\n"${firstUserMessage}"`,
        maxOutputTokens: 20,
        temperature: 0,
      });
      const cleanTopic = result.text.trim().replace(/^["']|["']$/g, '');
      if (cleanTopic) {
        await ConversationService.update(conversationId, { topic: cleanTopic });
      }
    } catch {
      // Topic is best-effort
    }
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
  }): Promise<{ conversationId: string; isNew: boolean }> {
    const existing = await ConversationService.findByExternalId({
      channelId,
      externalId: clientSessionId,
    });
    if (existing) return { conversationId: existing.id, isNew: false };

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
    return { conversationId: created.id, isNew: true };
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
    isPaid,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
    message: string;
    ip?: string;
    isPaid?: boolean;
  }): Promise<string> {
    try {
      await client.threads.create({
        threadId: conversationId,
        ifExists: 'do_nothing',
      });
      const result = await client.runs.wait(conversationId, 'agent', {
        input: { messages: [{ role: 'human', content: message }] },
        config: { configurable: { agentId, channelId, orgId, ip, isPaid } },
        multitaskStrategy: 'interrupt',
      });
      const msgs =
        (result as { messages?: Array<{ type?: string; content?: string }> })
          .messages ?? [];
      const last = msgs.at(-1);
      return typeof last?.content === 'string' ? last.content : '';
    } catch (err) {
      if (err instanceof V2OrchestrationError) throw err;
      throw new V2OrchestrationError();
    }
  }

  /**
   * Streaming invoke — used by both the web channel and the dashboard preview.
   *
   * Orchestration emits `messages/partial` SSE events. Each event carries the
   * CUMULATIVE content of the AIMessageChunk so far (LangGraph accumulates in
   * messages mode). We compute the true delta by slicing off the previously
   * seen content for that call ID.
   *
   * Structured-output calls (rewriteQuery, extractEntities, scoreSentiment)
   * emit JSON content starting with '{' — those are skipped so only the
   * natural-language RAG response reaches the client.
   *
   * onFinish fires after [DONE] so callers can trigger usage tracking and
   * enrichment at the right time.
   */
  static async stream({
    agentId,
    conversationId,
    channelId,
    orgId,
    message,
    ip,
    isPaid,
    onFinish,
  }: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
    message: string;
    ip?: string;
    isPaid?: boolean;
    onFinish?: () => void;
  }): Promise<ReadableStream> {
    const msgId = crypto.randomUUID();
    const encoder = new TextEncoder();
    const sse = (data: object | string) =>
      encoder.encode(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);

    return new ReadableStream({
      async start(controller) {
        const enqueue = (data: object | string) => controller.enqueue(sse(data));

        try {
          await client.threads.create({ threadId: conversationId, ifExists: 'do_nothing' });

          const lgStream = client.runs.stream(conversationId, 'agent', {
            input: { messages: [{ role: 'human', content: message }] },
            config: { configurable: { agentId, channelId, orgId, ip, isPaid } },
            streamMode: 'messages',
            multitaskStrategy: 'interrupt',
          });

          const skipIds = new Set<string>();
          // prevContent tracks the cumulative content seen for the target call
          // so we can slice off the new portion on each event.
          const prevContent: Record<string, string> = {};
          let targetId: string | null = null;
          let started = false;

          enqueue({ type: 'start' });
          enqueue({ type: 'start-step' });

          for await (const chunk of lgStream) {
            if (chunk.event !== 'messages/partial') continue;

            const msg = (Array.isArray(chunk.data) ? chunk.data[0] : chunk.data) as {
              id?: string;
              content?: string;
            } | null;

            if (!msg?.id || typeof msg.content !== 'string') continue;
            if (skipIds.has(msg.id)) continue;

            // First event from this call ID — classify by content
            if (msg.id !== targetId && !(msg.id in prevContent)) {
              if (msg.content.trimStart().startsWith('{')) {
                // Structured-output call (JSON) — skip entirely
                skipIds.add(msg.id);
                continue;
              }
              // Natural-language RAG response — stream this call
              targetId = msg.id;
              prevContent[msg.id] = '';
            }

            if (msg.id !== targetId) continue;

            // msg.content is CUMULATIVE — compute the new portion by slicing.
            const delta = msg.content.slice(prevContent[msg.id]?.length ?? 0);
            prevContent[msg.id] = msg.content;

            if (!delta) continue;

            if (!started) {
              enqueue({ type: 'text-start', id: msgId });
              started = true;
            }
            enqueue({ type: 'text-delta', id: msgId, delta });
          }

          if (started) enqueue({ type: 'text-end', id: msgId });
          enqueue({ type: 'finish-step' });
          enqueue({ type: 'finish', finishReason: 'stop' });
          enqueue('[DONE]');
          controller.close();
          onFinish?.();
        } catch {
          // Orchestration is down or threw — emit a clean error message
          try {
            enqueue({ type: 'text-start', id: msgId });
            enqueue({ type: 'text-delta', id: msgId, delta: 'Sorry, the AI assistant is temporarily unavailable. Please try again in a moment.' });
            enqueue({ type: 'text-end', id: msgId });
            enqueue({ type: 'finish-step' });
            enqueue({ type: 'finish', finishReason: 'stop' });
            enqueue('[DONE]');
            controller.close();
          } catch {
            controller.close();
          }
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

    await assertAgentActive(channel.agentId, channel.orgId);

    const limit =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(
        channel.orgId,
      );
    if (!limit.allowed) {
      throw new V2LimitError(
        SubscriptionService.getMessageLimitReachedMessage(limit),
        {
          plan: limit.plan,
          messagesPerMonthLimit: limit.messagesPerMonthLimit,
          messagesThisMonth: limit.messagesThisMonth,
        },
      );
    }

    const { conversationId: resolvedId, isNew } =
      await ChatV2Service.findOrCreate({
        channelId,
        agentId: channel.agentId,
        conversationId,
        orgId: channel.orgId,
        firstUserMessage: message,
      });

    const plan = await SubscriptionService.getPlan(channel.orgId);
    const isPaid = plan !== 'free';

    return ChatV2Service.stream({
      agentId: channel.agentId,
      conversationId: resolvedId,
      channelId,
      orgId: channel.orgId,
      message,
      ip,
      isPaid,
      onFinish: () => {
        void OrgUsageMonthlyService.incrementAssistantMessages(channel.orgId);
        if (isPaid) {
          void enrichConversationAsync({
            conversationId: resolvedId,
            ip,
            isNew,
            firstUserMessage: message,
          });
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
    if (!channel || channel.type !== 'whatsapp')
      throw new V2NotFoundError('WhatsApp channel not found');

    const cfg = channel.config as IChannelWhatsAppConfig;
    if (!cfg.phoneNumberId)
      throw new V2NotFoundError('WhatsApp channel not configured');

    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) throw new V2NotFoundError('WhatsApp not connected');

    await assertAgentActive(channel.agentId, orgId);

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
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
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

    const limit =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!limit.allowed) {
      throw new V2LimitError(
        SubscriptionService.getMessageLimitReachedMessage(limit),
        {
          plan: limit.plan,
          messagesPerMonthLimit: limit.messagesPerMonthLimit,
          messagesThisMonth: limit.messagesThisMonth,
        },
      );
    }

    const plan = await SubscriptionService.getPlan(orgId);
    const isPaid = plan !== 'free';

    const { conversationId, isNew } = await findOrCreateByExternalId({
      channelId,
      agentId: channel.agentId,
      externalId: senderPhone,
      firstUserMessage: message,
    });

    let response: string;
    try {
      response = await ChatV2Service.invoke({
        agentId: channel.agentId,
        conversationId,
        channelId,
        orgId,
        message,
        ip,
        isPaid,
      });
    } catch (err) {
      const errorMsg =
        err instanceof V2OrchestrationError
          ? err.message
          : 'Sorry, the AI assistant is temporarily unavailable. Please try again in a moment.';
      await fetch(waBase, {
        method: 'POST',
        headers: waHeaders,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: senderPhone,
          type: 'text',
          text: { body: errorMsg },
        }),
      });
      return;
    }

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

    if (isPaid) {
      void enrichConversationAsync({
        conversationId,
        ip,
        isNew,
        firstUserMessage: message,
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
    if (!channel || channel.type !== 'slack')
      throw new V2NotFoundError('Slack channel not found');

    const cfg = channel.config as IChannelSlackConfig;
    if (!cfg.slackChannelId)
      throw new V2NotFoundError('Slack channel not configured');

    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) throw new V2NotFoundError('Slack not connected');

    await assertAgentActive(channel.agentId, orgId);

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
        body: JSON.stringify({
          channel: slackChannelId,
          text: '_Thinking…_',
          thread_ts: threadTs,
        }),
      });
      const data = (await res.json()) as { ok: boolean; ts?: string };
      if (data.ok && data.ts) placeholderTs = data.ts;
    } catch {
      // Best-effort — proceed even if placeholder fails
    }

    const limit =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
    if (!limit.allowed) {
      throw new V2LimitError(
        SubscriptionService.getMessageLimitReachedMessage(limit),
        {
          plan: limit.plan,
          messagesPerMonthLimit: limit.messagesPerMonthLimit,
          messagesThisMonth: limit.messagesThisMonth,
        },
      );
    }

    const plan = await SubscriptionService.getPlan(orgId);
    const isPaid = plan !== 'free';

    const { conversationId, isNew } = await findOrCreateByExternalId({
      channelId,
      agentId: channel.agentId,
      externalId: threadTs,
      firstUserMessage: message,
    });

    let response: string;
    try {
      response = await ChatV2Service.invoke({
        agentId: channel.agentId,
        conversationId,
        channelId,
        orgId,
        message,
        ip,
        isPaid,
      });
    } catch (err) {
      const errorMsg =
        err instanceof V2OrchestrationError
          ? err.message
          : 'Sorry, the AI assistant is temporarily unavailable. Please try again in a moment.';
      if (placeholderTs) {
        fetch('https://slack.com/api/chat.update', {
          method: 'POST',
          headers: slackHeaders,
          body: JSON.stringify({
            channel: slackChannelId,
            ts: placeholderTs,
            text: errorMsg,
          }),
        }).catch(() => {});
      } else {
        fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: slackHeaders,
          body: JSON.stringify({
            channel: slackChannelId,
            text: errorMsg,
            thread_ts: threadTs,
          }),
        }).catch(() => {});
      }
      return;
    }

    if (placeholderTs) {
      fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          ts: placeholderTs,
          text: response,
        }),
      }).catch(() => {});
    } else {
      fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          text: response,
          thread_ts: threadTs,
        }),
      }).catch(() => {});
    }

    void OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    if (isPaid) {
      void enrichConversationAsync({
        conversationId,
        ip,
        isNew,
        firstUserMessage: message,
      });
    }
  }
}
