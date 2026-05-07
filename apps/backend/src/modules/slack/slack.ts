import { createHmac } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import { agents } from '../../db/schema/agents';
import type { IChannelSlackConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';
import { SubscriptionService } from '../subscription/service';
import { SlackConnectionService } from './connectionService';

const BadRequestResponse = z.object({
  code: z.string(),
  message: z.string(),
});

export const Slack = new Elysia({ tags: ['Slack'] })
  .use(ErrorModel)

  // ─── POST /webhook/slack — Inbound events + slash commands ────────────────
  .post(
    '/webhook/slack',
    async ({ body, headers, request }) => {
      const contentType = headers['content-type'] ?? '';

      // ── Slash commands (application/x-www-form-urlencoded) ────────────────
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const rawBody = await request.clone().text();
        const sig = headers['x-slack-signature'] ?? '';
        const ts = headers['x-slack-request-timestamp'] ?? '';

        if (!verifySlackSignature(sig, ts, rawBody)) {
          return new Response(
            JSON.stringify({ code: 'FORBIDDEN', message: 'Invalid signature' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        }

        const params = new URLSearchParams(rawBody);
        const command = (params.get('command') ?? '').replace(/^\//, '');
        const text = params.get('text') ?? '';
        const teamId = params.get('team_id') ?? '';
        const channelId = params.get('channel_id') ?? '';
        const userId = params.get('user_id') ?? '';
        const responseUrl = params.get('response_url') ?? '';

        if (command && teamId) {
          void processSlashCommand({
            command,
            text,
            teamId,
            slackChannelId: channelId,
            userId,
            responseUrl,
          }).catch(console.error);
        }

        // Acknowledge immediately to beat Slack's 3-second timeout
        return new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ── Events API (application/json) ─────────────────────────────────────
      const payload = body as {
        type?: string;
        challenge?: string;
        event?: {
          type?: string;
          user?: string;
          text?: string;
          channel?: string;
          bot_id?: string;
          subtype?: string;
          ts?: string;
          thread_ts?: string;
        };
        team_id?: string;
      };

      // URL verification — no signature check required by Slack on this event
      if (payload.type === 'url_verification') {
        return new Response(JSON.stringify({ challenge: payload.challenge }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify signature for all other events
      const rawBody = JSON.stringify(body);
      const sig = headers['x-slack-signature'] ?? '';
      const ts = headers['x-slack-request-timestamp'] ?? '';

      if (!verifySlackSignature(sig, ts, rawBody)) {
        return new Response(
          JSON.stringify({ code: 'FORBIDDEN', message: 'Invalid signature' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }

      void processInboundEvent(payload).catch(console.error);
      return new Response('OK', { status: 200 });
    },
    { body: t.Any() },
  )

  // ─── OAuth callback — browser redirect after Slack approval ──────────────
  .get(
    '/slack/oauth/callback',
    async ({ query }) => {
      const { code, state: orgId } = query;

      if (!code || !orgId) {
        return new Response('Missing code or state', { status: 400 });
      }

      const params = new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID ?? '',
        client_secret: process.env.SLACK_CLIENT_SECRET ?? '',
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI ?? '',
      });

      const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!tokenRes.ok) {
        return Response.redirect(
          `${process.env.APP_URL}/integrations?slack_error=1`,
        );
      }

      const tokenData = (await tokenRes.json()) as {
        ok: boolean;
        access_token?: string;
        team?: { id: string; name: string };
        bot_user_id?: string;
        error?: string;
      };

      if (!tokenData.ok || !tokenData.access_token || !tokenData.team) {
        console.error('[Slack OAuth] exchange failed:', tokenData.error);
        return Response.redirect(
          `${process.env.APP_URL}/integrations?slack_error=1`,
        );
      }

      await SlackConnectionService.upsert(orgId, {
        botToken: tokenData.access_token,
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        botUserId: tokenData.bot_user_id ?? '',
      });

      return Response.redirect(
        `${process.env.APP_URL}/integrations?slack_connected=1`,
      );
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        state: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    },
  )

  // ─── Authenticated endpoints ───────────────────────────────────────────────
  .use(AuthGuard)
  .model({ BadRequestResponse })
  .guard({
    response: {
      400: 'BadRequestResponse',
      404: 'NotFoundResponse',
    },
  })

  // GET /slack/oauth/start — return OAuth URL for frontend redirect
  .get('/slack/oauth/start', ({ orgId }) => {
    const scopes = [
      'channels:read',
      'groups:read',
      'chat:write',
      'app_mentions:read',
      'channels:history',
      'groups:history',
      'commands',
    ].join(',');

    const url = new URL('https://slack.com/oauth/v2/authorize');
    url.searchParams.set('client_id', process.env.SLACK_CLIENT_ID ?? '');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', orgId);
    url.searchParams.set('redirect_uri', process.env.SLACK_REDIRECT_URI ?? '');

    return { url: url.toString() };
  })

  // GET /slack/connection — workspace info + bot-joined channels
  .get('/slack/connection', async ({ orgId }) => {
    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) {
      return { connected: false, teamName: null, channels: [] };
    }

    let slackChannels: { slackChannelId: string; slackChannelName: string }[] =
      [];
    try {
      const res = await fetch(
        'https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=200',
        { headers: { Authorization: `Bearer ${connection.botToken}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          ok: boolean;
          channels: { id: string; name: string; is_member: boolean }[];
        };
        if (data.ok) {
          slackChannels = data.channels
            .filter((c) => c.is_member)
            .map((c) => ({ slackChannelId: c.id, slackChannelName: c.name }));
        }
      }
    } catch {
      // Best-effort
    }

    // Enrich: which agent channel has each Slack channel bound
    const enriched = await Promise.all(
      slackChannels.map(async (sc) => {
        const bound = await db
          .select({
            channelId: channels.id,
            agentId: agents.id,
            agentName: agents.name,
          })
          .from(channels)
          .innerJoin(agents, eq(channels.agentId, agents.id))
          .where(
            and(
              eq(channels.type, 'slack'),
              eq(agents.orgId, orgId),
              sql`${channels.config}->>'slackChannelId' = ${sc.slackChannelId}`,
            ),
          )
          .limit(1);

        return {
          ...sc,
          boundToAgentId: bound[0]?.agentId ?? null,
          agentName: bound[0]?.agentName ?? null,
        };
      }),
    );

    return {
      connected: true,
      teamName: connection.teamName,
      channels: enriched,
    };
  })

  // DELETE /slack/connection — org-level disconnect
  .delete('/slack/connection', async ({ orgId, status }) => {
    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'No Slack connection found',
      });
    }

    // Clear all Slack channel configs in this org
    const orgSlackChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(and(eq(channels.type, 'slack'), eq(agents.orgId, orgId)));

    for (const ch of orgSlackChannels) {
      await ChannelService.update(ch.id, {
        config: {},
        channelStatus: 'inactive',
        enabled: false,
      });
    }

    await SlackConnectionService.delete(orgId);
    return { success: true };
  })

  // POST /slack/bind — bind a Slack channel/command to an agent's channel record
  .post(
    '/slack/bind',
    async ({ body, orgId, status }) => {
      const channelAccess =
        await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(channelAccess.plan),
        });
      }

      const {
        channelId,
        mode,
        slackChannelId,
        slackChannelName,
        commandKeyword,
        commandChannelId,
        commandChannelName,
      } = body;

      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel || channel.type !== 'slack') {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Slack channel not found',
        });
      }

      // Prevent double-binding for channel/mention modes
      if (
        (mode === 'channel' || mode === 'mention') &&
        slackChannelId
      ) {
        const existing = await db
          .select({ id: channels.id })
          .from(channels)
          .innerJoin(agents, eq(channels.agentId, agents.id))
          .where(
            and(
              eq(channels.type, 'slack'),
              eq(agents.orgId, orgId),
              sql`${channels.config}->>'slackChannelId' = ${slackChannelId}`,
              sql`${channels.config}->>'mode' = ${mode}`,
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0].id !== channelId) {
          return status(400, {
            code: 'BAD_REQUEST',
            message: `This Slack channel is already assigned to another agent in ${mode} mode`,
          });
        }
      }

      // Prevent duplicate keyword within workspace for command mode
      if (mode === 'command' && commandKeyword) {
        const connection = await SlackConnectionService.findByOrg(orgId);
        if (connection) {
          const existingCmd = await db
            .select({ id: channels.id })
            .from(channels)
            .innerJoin(agents, eq(channels.agentId, agents.id))
            .where(
              and(
                eq(channels.type, 'slack'),
                eq(agents.orgId, orgId),
                sql`${channels.config}->>'mode' = 'command'`,
                sql`${channels.config}->>'commandKeyword' = ${commandKeyword}`,
              ),
            )
            .limit(1);

          if (existingCmd.length > 0 && existingCmd[0].id !== channelId) {
            return status(400, {
              code: 'BAD_REQUEST',
              message: `The keyword "${commandKeyword}" is already assigned to another agent`,
            });
          }
        }
      }

      const config: IChannelSlackConfig = {
        mode,
        ...(mode !== 'command' && slackChannelId
          ? { slackChannelId, slackChannelName }
          : {}),
        ...(mode === 'command' && commandKeyword
          ? {
              commandKeyword,
              ...(commandChannelId ? { commandChannelId, commandChannelName } : {}),
            }
          : {}),
      };

      const updated = await ChannelService.update(channelId, {
        config,
        channelStatus: 'active',
        enabled: true,
      });

      return { channel: ChannelService.transformChannel(updated) };
    },
    {
      body: t.Object({
        channelId: t.String(),
        mode: t.Union([
          t.Literal('channel'),
          t.Literal('mention'),
          t.Literal('command'),
        ]),
        slackChannelId: t.Optional(t.String()),
        slackChannelName: t.Optional(t.String()),
        commandKeyword: t.Optional(t.String()),
        commandChannelId: t.Optional(t.String()),
        commandChannelName: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /slack/bind/:channelId — unassign
  .delete('/slack/bind/:channelId', async ({ params, orgId, status }) => {
    const channel = await ChannelService.single({
      id: params.channelId,
      orgId,
    });
    if (!channel || channel.type !== 'slack') {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Slack channel not found',
      });
    }

    const updated = await ChannelService.update(params.channelId, {
      config: {},
      channelStatus: 'inactive',
      enabled: false,
    });

    return { channel: ChannelService.transformChannel(updated) };
  });

// ─── Webhook signature verification ─────────────────────────────────────────
function verifySlackSignature(
  sig: string,
  ts: string,
  rawBody: string,
): boolean {
  if (!sig || !ts) return false;

  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (Number.isNaN(age) || age > 300) return false;

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return false;

  const expected = `v0=${createHmac('sha256', signingSecret)
    .update(`v0:${ts}:${rawBody}`)
    .digest('hex')}`;

  return expected === sig;
}

// ─── Process inbound Slack Events API event ──────────────────────────────────
async function processInboundEvent(payload: {
  type?: string;
  event?: {
    type?: string;
    user?: string;
    text?: string;
    channel?: string;
    bot_id?: string;
    subtype?: string;
    ts?: string;
    thread_ts?: string;
  };
}) {
  if (payload.type !== 'event_callback') return;

  const event = payload.event;
  if (!event || !event.user || !event.text || !event.channel || !event.ts)
    return;

  // Ignore bot messages and message edits/deletes
  if (event.bot_id || event.subtype) return;

  const slackChannelId = event.channel;
  // Thread anchor: use existing thread_ts if in a thread, otherwise start one from event.ts
  const threadTs = event.thread_ts ?? event.ts;
  // Strip Slack mention tokens like <@U0B11CJ8Z8A> from the message text
  const cleanText = (event.text ?? '').replace(/<@[A-Z0-9]+>/g, '').trim();

  if (!cleanText) return;

  if (event.type === 'message') {
    const result = await ChannelService.findBySlackChannelId(
      slackChannelId,
      'channel',
    );
    if (!result?.enabled || !result.agent) return;

    await ChatService.sendSlack({
      channelId: result.id,
      orgId: result.agent.orgId,
      message: cleanText,
      slackChannelId,
      threadTs,
    });
  } else if (event.type === 'app_mention') {
    const result = await ChannelService.findBySlackChannelId(
      slackChannelId,
      'mention',
    );
    if (!result?.enabled || !result.agent) return;

    await ChatService.sendSlack({
      channelId: result.id,
      orgId: result.agent.orgId,
      message: cleanText,
      slackChannelId,
      threadTs,
    });
  }
}

// ─── Process slash command ───────────────────────────────────────────────────
async function processSlashCommand({
  text,
  teamId,
  slackChannelId,
  responseUrl,
}: {
  command: string;
  text: string;
  teamId: string;
  slackChannelId: string;
  userId: string;
  responseUrl: string;
}) {
  const parts = text.trim().split(/\s+/);
  const keyword = parts[0]?.toLowerCase() ?? '';
  const question = parts.slice(1).join(' ').trim();

  if (!keyword || !question) {
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'ephemeral',
        text: 'Usage: `/agenvik <keyword> <your question>`',
      }),
    });
    return;
  }

  const result = await ChannelService.findBySlackCommandKeyword(teamId, keyword);
  if (!result?.enabled || !result.agent) return;

  // Respect optional channel restriction
  const config = result.config as IChannelSlackConfig;
  if (config.commandChannelId && config.commandChannelId !== slackChannelId) return;

  const { assistantMessage } = await ChatService.generateWhatsAppResponse({
    agentId: result.agentId,
    channelId: result.id,
    message: question,
    orgId: result.agent.orgId,
  });

  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_type: 'ephemeral',
      text: assistantMessage,
    }),
  });
}
