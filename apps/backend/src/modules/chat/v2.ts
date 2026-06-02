/**
 * V2 Chat API — powered by the LangGraph orchestration server.
 *
 * Channels handled:
 *  - Web  : streaming SSE (proxied from LangGraph server)
 *  - WhatsApp: non-streaming, with typing indicator + read receipts
 *  - Slack   : non-streaming, with "Thinking…" placeholder
 */

import { Client } from '@langchain/langgraph-sdk';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type { IChannelWebConfig, IChannelWhatsAppConfig, IChannelSlackConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ConversationService } from '../conversation/service';
import { SubscriptionService } from '../subscription/service';
import { SlackConnectionService } from '../slack/connectionService';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';

// ── LangGraph client ──────────────────────────────────────────────────────────

function getOrchestrationClient() {
  const url = process.env.ORCHESTRATION_URL ?? 'http://localhost:2024';
  return new Client({ apiUrl: url });
}

// ── Error helpers ─────────────────────────────────────────────────────────────

class V2NotFoundError extends Error {
  constructor(msg: string) { super(msg); this.name = 'V2NotFoundError'; }
}
class V2ForbiddenError extends Error {
  constructor(msg: string) { super(msg); this.name = 'V2ForbiddenError'; }
}
class V2LimitError extends Error {
  constructor(
    msg: string,
    readonly payload: { plan: string; messagesPerMonthLimit: number; messagesThisMonth: number },
  ) { super(msg); this.name = 'V2LimitError'; }
}

// ── Domain check ──────────────────────────────────────────────────────────────

function isDomainAllowed(origin: string | undefined, allowedDomains: string[]): boolean {
  if (!allowedDomains.length) return true;
  if (!origin) return false;
  try {
    return allowedDomains.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

// ── Invoke graph (non-streaming) ──────────────────────────────────────────────

async function invokeGraph({
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
  const client = getOrchestrationClient();

  const result = await client.runs.wait(conversationId, 'agent', {
    input: {
      messages: [{ role: 'human', content: message }],
    },
    config: {
      configurable: { agentId, channelId, orgId, ip },
    },
  });

  return (result as { response?: string }).response ?? '';
}

// ── Stream graph (web) ────────────────────────────────────────────────────────

async function streamGraph({
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
  const client = getOrchestrationClient();

  const stream = client.runs.stream(conversationId, 'agent', {
    input: {
      messages: [{ role: 'human', content: message }],
    },
    config: {
      configurable: { agentId, channelId, orgId, ip },
    },
    streamMode: 'values',
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const state = chunk.data as { response?: string };
          if (state?.response) {
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'text', text: state.response })}\n\n`,
            ));
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

// ── V2 Elysia routes ──────────────────────────────────────────────────────────

export const ChatV2 = new Elysia({ prefix: '/v2/chat', tags: ['Chats V2'] })

  // ── Web (streaming) ───────────────────────────────────────────────────────
  .post(
    '/web',
    async ({ body, status, headers, set }) => {
      const { message, channelId, conversationId, parentOrigin } = body;
      const ip =
        (headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        (headers['x-real-ip'] as string | undefined) ??
        undefined;

      try {
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

        const stream = await streamGraph({
          agentId: channel.agentId,
          conversationId,
          channelId,
          orgId: channel.orgId,
          message,
          ip,
        });

        set.headers['Content-Type'] = 'text/event-stream';
        set.headers['Cache-Control'] = 'no-cache';
        set.headers['Connection'] = 'keep-alive';
        return stream;
      } catch (err) {
        if (err instanceof V2NotFoundError) return status(404, { code: 'NOT_FOUND', message: err.message });
        if (err instanceof V2ForbiddenError) return status(403, { code: 'FORBIDDEN', message: err.message });
        if (err instanceof V2LimitError) return status(403, { code: 'MESSAGE_LIMIT_REACHED', message: err.message, ...err.payload });
        throw err;
      }
    },
    {
      body: z.object({
        message: z.string().min(1),
        channelId: z.string(),
        conversationId: z.string(),
        parentOrigin: z.string().optional(),
      }),
    },
  )

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  .post(
    '/whatsapp',
    async ({ body, status }) => {
      const { channelId, orgId, senderPhone, message, messageId } = body;

      try {
        const channel = await ChannelService.single({ id: channelId, orgId });
        if (!channel || channel.type !== 'whatsapp') throw new V2NotFoundError('WhatsApp channel not found');

        const cfg = channel.config as IChannelWhatsAppConfig;
        if (!cfg.phoneNumberId) throw new V2NotFoundError('WhatsApp channel not configured');

        const connection = await WhatsAppConnectionService.findByOrg(orgId);
        if (!connection) throw new V2NotFoundError('WhatsApp not connected');

        const conversation = await ConversationService.findByExternalId({ channelId, externalId: senderPhone });

        const waHeaders = {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        };
        const waBase = `https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`;

        // Read receipt
        if (messageId) {
          fetch(waBase, {
            method: 'POST', headers: waHeaders,
            body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
          }).catch(() => {});
        }

        // Typing indicator
        fetch(waBase, {
          method: 'POST', headers: waHeaders,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: senderPhone,
            type: 'typing_indicator',
            typing_indicator: { type: 'text' },
          }),
        }).catch(() => {});

        const conversationId = conversation?.id ?? crypto.randomUUID();

        const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
        if (!limit.allowed) throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), limit);

        const response = await invokeGraph({
          agentId: channel.agentId,
          conversationId,
          channelId,
          orgId,
          message,
        });

        // Send reply
        await fetch(waBase, {
          method: 'POST', headers: waHeaders,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: response },
          }),
        });

        return { ok: true };
      } catch (err) {
        if (err instanceof V2NotFoundError) return status(404, { code: 'NOT_FOUND', message: err.message });
        throw err;
      }
    },
    {
      body: z.object({
        channelId: z.string(),
        orgId: z.string(),
        senderPhone: z.string(),
        message: z.string(),
        messageId: z.string().optional(),
      }),
    },
  )

  // ── Slack ─────────────────────────────────────────────────────────────────
  .post(
    '/slack',
    async ({ body, status }) => {
      const { channelId, orgId, message, slackChannelId, threadTs } = body;

      try {
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

        // Post placeholder "Thinking…" before LLM call
        let placeholderTs: string | null = null;
        try {
          const res = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST', headers: slackHeaders,
            body: JSON.stringify({ channel: slackChannelId, text: '_Thinking…_', thread_ts: threadTs }),
          });
          const data = (await res.json()) as { ok: boolean; ts?: string };
          if (data.ok && data.ts) placeholderTs = data.ts;
        } catch {}

        const conversation = await ConversationService.findByExternalId({ channelId, externalId: threadTs });
        const conversationId = conversation?.id ?? crypto.randomUUID();

        const limit = await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
        if (!limit.allowed) throw new V2LimitError(SubscriptionService.getMessageLimitReachedMessage(limit), limit);

        const response = await invokeGraph({
          agentId: channel.agentId,
          conversationId,
          channelId,
          orgId,
          message,
        });

        // Update placeholder or post new message
        if (placeholderTs) {
          fetch('https://slack.com/api/chat.update', {
            method: 'POST', headers: slackHeaders,
            body: JSON.stringify({ channel: slackChannelId, ts: placeholderTs, text: response }),
          }).catch(() => {});
        } else {
          fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST', headers: slackHeaders,
            body: JSON.stringify({ channel: slackChannelId, text: response, thread_ts: threadTs }),
          }).catch(() => {});
        }

        return { ok: true };
      } catch (err) {
        if (err instanceof V2NotFoundError) return status(404, { code: 'NOT_FOUND', message: err.message });
        throw err;
      }
    },
    {
      body: z.object({
        channelId: z.string(),
        orgId: z.string(),
        message: z.string(),
        slackChannelId: z.string(),
        threadTs: z.string(),
      }),
    },
  );
