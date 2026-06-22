import { toUIMessageStream } from '@ai-sdk/langchain';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createUIMessageStreamResponse } from 'ai';
import { logger } from '../../utils/logger.utils';
import type {
  IChannelSlackConfig,
  IChannelWebConfig,
  IChannelWhatsAppConfig,
} from '../channel/model';
import { ChannelService } from '../channel/service';
import { graph } from '../graph/graph';
import { suppressPipelineNodes } from '../graph/utils/stream';
import { SlackConnectionService } from '../slack/connectionService';
import { SubscriptionService } from '../subscription/service';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';

const log = logger.child({ module: 'chatv2' });

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
      ReturnType<
        typeof SubscriptionService.assertMessagesPerMonthLimitNotReached
      >
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
    const result =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);
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
              configurable: {
                agentId,
                orgId,
                channelId,
                thread_id: conversationId,
                isPaid,
                ip,
              },
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
    log.debug(
      { channelId, orgId, senderPhone, messageId },
      'sendWhatsApp start',
    );

    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'whatsapp') {
      log.warn(
        { channelId, orgId, found: !!channel, type: channel?.type },
        'WhatsApp channel not found',
      );
      throw new NotFoundError('WhatsApp channel not found');
    }
    const config = channel.config as IChannelWhatsAppConfig;
    if (!config.phoneNumberId) {
      log.warn(
        { channelId, orgId },
        'WhatsApp channel missing phoneNumberId config',
      );
      throw new NotFoundError('WhatsApp channel not configured');
    }

    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) {
      log.warn({ orgId }, 'WhatsApp connection not found for org');
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
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      })
        .then((res) =>
          res.ok
            ? undefined
            : res
                .json()
                .then((b) =>
                  log.warn(
                    { status: res.status, body: b },
                    'WA seen receipt failed',
                  ),
                ),
        )
        .catch((err) => log.error({ err }, 'WA seen receipt request failed'));
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
    })
      .then((res) =>
        res.ok
          ? undefined
          : res
              .json()
              .then((b) =>
                log.warn(
                  { status: res.status, body: b },
                  'WA typing indicator failed',
                ),
              ),
      )
      .catch((err) => log.error({ err }, 'WA typing indicator request failed'));

    // ── Invoke graph ──────────────────────────────────────────────────────
    log.debug(
      { channelId, orgId, thread_id, agentId: channel.agentId },
      'invoking graph',
    );
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

    const lastAI = [...finalState.messages]
      .reverse()
      .find((m) => AIMessage.isInstance(m));
    const assistantText =
      typeof lastAI?.content === 'string' ? lastAI.content : '';

    if (!assistantText) {
      log.warn(
        {
          channelId,
          orgId,
          thread_id,
          hasLastAI: !!lastAI,
          contentType: typeof lastAI?.content,
        },
        'graph produced empty assistantText — WhatsApp reply will be blank',
      );
    } else {
      log.debug(
        { channelId, orgId, thread_id, length: assistantText.length },
        'graph produced assistant reply',
      );
    }

    // ── Send reply ────────────────────────────────────────────────────────
    const replyRes = await fetch(waUrl, {
      method: 'POST',
      headers: waHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: senderPhone,
        type: 'text',
        text: { body: assistantText },
      }),
    });

    if (!replyRes.ok) {
      const errBody = await replyRes.json().catch(() => ({}));
      log.error(
        {
          status: replyRes.status,
          body: errBody,
          channelId,
          orgId,
          senderPhone,
        },
        'WhatsApp reply send failed',
      );
    } else {
      log.debug({ channelId, orgId, senderPhone }, 'WhatsApp reply sent');
    }
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
    log.debug(
      { channelId, orgId, slackChannelId, threadTs },
      'sendSlack start',
    );

    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'slack') {
      log.warn(
        { channelId, orgId, found: !!channel, type: channel?.type },
        'Slack channel not found',
      );
      throw new NotFoundError('Slack channel not found');
    }
    const config = channel.config as IChannelSlackConfig;
    if (!config.slackChannelId) {
      log.warn(
        { channelId, orgId },
        'Slack channel missing slackChannelId config',
      );
      throw new NotFoundError('Slack channel not configured');
    }

    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) {
      log.warn({ orgId }, 'Slack connection not found for org');
      throw new NotFoundError('Slack not connected for this org');
    }

    // threadTs is stable per Slack thread — use as thread_id directly
    const thread_id = threadTs;
    log.debug({ thread_id, message: message.slice(0, 80) }, 'thread resolved');

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
        body: JSON.stringify({
          channel: slackChannelId,
          text: '_Thinking…_',
          thread_ts: threadTs,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        ts?: string;
        error?: string;
      };
      if (data.ok && data.ts) {
        placeholderTs = data.ts;
        log.debug({ ts: data.ts }, 'thinking placeholder posted');
      } else {
        log.warn(
          { status: res.status, error: data.error },
          'thinking placeholder failed',
        );
      }
    } catch (err) {
      log.error({ err }, 'thinking placeholder request failed');
    }

    // ── Invoke graph ──────────────────────────────────────────────────────
    log.debug(
      { channelId, orgId, thread_id, agentId: channel.agentId },
      'invoking graph',
    );
    let assistantText = '';
    try {
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
      const lastAI = [...finalState.messages]
        .reverse()
        .find((m) => AIMessage.isInstance(m));
      assistantText = typeof lastAI?.content === 'string' ? lastAI.content : '';

      if (!assistantText) {
        log.warn(
          {
            channelId,
            orgId,
            thread_id,
            hasLastAI: !!lastAI,
            contentType: typeof lastAI?.content,
          },
          'graph produced empty assistantText — Slack reply will be blank',
        );
      } else {
        log.debug(
          { channelId, orgId, thread_id, length: assistantText.length },
          'graph produced assistant reply',
        );
      }
    } catch (err) {
      log.error({ err, channelId, orgId, thread_id }, 'graph.invoke failed');
      assistantText = 'Sorry, something went wrong. Please try again.';
    }

    // ── Update placeholder or post new message ────────────────────────────
    if (placeholderTs) {
      const updateRes = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          ts: placeholderTs,
          text: assistantText,
        }),
      });
      const updateData = (await updateRes.json()) as {
        ok: boolean;
        error?: string;
      };
      if (updateData.ok) {
        log.debug(
          { channelId, orgId, slackChannelId, ts: placeholderTs },
          'chat.update succeeded',
        );
      } else {
        log.error(
          {
            status: updateRes.status,
            error: updateData.error,
            channelId,
            orgId,
            slackChannelId,
          },
          'chat.update failed',
        );
      }
    } else {
      const postRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          text: assistantText,
          thread_ts: threadTs,
        }),
      });
      const postData = (await postRes.json()) as {
        ok: boolean;
        error?: string;
      };
      if (postData.ok) {
        log.debug(
          { channelId, orgId, slackChannelId },
          'chat.postMessage succeeded',
        );
      } else {
        log.error(
          {
            status: postRes.status,
            error: postData.error,
            channelId,
            orgId,
            slackChannelId,
          },
          'chat.postMessage failed',
        );
      }
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
              configurable: {
                agentId,
                orgId,
                channelId,
                thread_id: conversationId,
                isPaid,
              },
            },
          ),
        ),
      ),
    });
  }
}
