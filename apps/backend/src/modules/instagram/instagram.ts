import { and, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { channels } from '../../db/schema/channels';
import type { IChannelInstagramConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';
import { SubscriptionService } from '../subscription/service';
import { InstagramConnectionService } from './connectionService';
import { generateOrgVerifyToken, verifyOrgVerifyToken } from './verifyToken';

const BadRequestResponse = z.object({
  code: z.string(),
  message: z.string(),
});

export const Instagram = new Elysia({ tags: ['Instagram'] })
  .use(ErrorModel)

  // ─── GET /webhook/instagram — Meta challenge verification ──────────────────
  .get(
    '/webhook/instagram',
    ({ query }) => {
      const mode = query['hub.mode'];
      const token = query['hub.verify_token'];
      const challenge = query['hub.challenge'];

      if (mode === 'subscribe' && token && challenge) {
        const orgId = verifyOrgVerifyToken(token);
        if (orgId) {
          return new Response(challenge, { status: 200 });
        }
      }

      return new Response(
        JSON.stringify({ code: 'FORBIDDEN', message: 'Invalid verify token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    },
    {
      query: t.Object({
        'hub.mode': t.Optional(t.String()),
        'hub.verify_token': t.Optional(t.String()),
        'hub.challenge': t.Optional(t.String()),
      }),
    },
  )

  // ─── POST /webhook/instagram — Inbound DMs from Meta ──────────────────────
  .post(
    '/webhook/instagram',
    async ({ body }) => {
      void processInboundMessage(body).catch(console.error);
      return new Response('OK', { status: 200 });
    },
    { body: t.Any() },
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

  // GET /instagram/setup-info
  .get('/instagram/setup-info', ({ orgId }) => {
    const verifyToken = generateOrgVerifyToken(orgId);
    const webhookUrl = `${process.env.API_BASE}/webhook/instagram`;
    return { webhookUrl, verifyToken };
  })

  // GET /instagram/test-connection — validate stored token against Meta
  .get('/instagram/test-connection', async ({ orgId, status }) => {
    const connection = await InstagramConnectionService.findByOrg(orgId);
    if (!connection) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'No Instagram connection found',
      });
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${connection.instagramAccountId}?fields=name,username`,
      { headers: { Authorization: `Bearer ${connection.pageAccessToken}` } },
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return status(400, {
        code: 'BAD_REQUEST',
        message:
          err.error?.message ??
          'Token is invalid or access to this Instagram account has been revoked',
      });
    }

    const data = (await res.json()) as { id: string; name?: string; username?: string };
    return { ok: true, username: data.username ?? data.name ?? data.id };
  })

  // GET /instagram/connection — org's connection status
  .get('/instagram/connection', async ({ orgId }) => {
    const connection = await InstagramConnectionService.findByOrg(orgId);

    if (!connection) {
      return { connected: false };
    }

    // Check which agent's channel has this Instagram account bound
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
          eq(channels.type, 'instagram'),
          eq(agents.orgId, orgId),
          sql`${channels.config}->>'instagramAccountId' = ${connection.instagramAccountId}`,
        ),
      )
      .limit(1);

    return {
      connected: true,
      instagramAccountId: connection.instagramAccountId,
      username: connection.username,
      boundToAgentId: bound[0]?.agentId ?? null,
      agentName: bound[0]?.agentName ?? null,
    };
  })

  // POST /instagram/connect — manual credential entry
  .post(
    '/instagram/connect',
    async ({ body, orgId, status }) => {
      const channelAccess = await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(channelAccess.plan),
        });
      }

      const { pageAccessToken, instagramAccountId } = body;

      // Validate credentials by fetching the Instagram account info
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=name,username`,
        { headers: { Authorization: `Bearer ${pageAccessToken}` } },
      );
      if (!igRes.ok) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'Invalid credentials — could not reach Instagram Business Account',
        });
      }
      const igData = (await igRes.json()) as { id: string; name?: string; username?: string };
      const username = igData.username ?? igData.name ?? instagramAccountId;

      // Subscribe to webhooks (best-effort)
      await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/subscribed_apps?subscribed_fields=messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${pageAccessToken}` },
        },
      ).catch(() => {});

      await InstagramConnectionService.upsert(orgId, {
        pageAccessToken,
        instagramAccountId,
        username,
      });

      return { instagramAccountId, username };
    },
    {
      body: t.Object({
        pageAccessToken: t.String(),
        instagramAccountId: t.String(),
      }),
    },
  )

  // DELETE /instagram/connection — org-level disconnect
  .delete('/instagram/connection', async ({ orgId, status }) => {
    const connection = await InstagramConnectionService.findByOrg(orgId);
    if (!connection) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'No Instagram connection found',
      });
    }

    // Unsubscribe from webhooks (best-effort)
    await fetch(
      `https://graph.facebook.com/v19.0/${connection.instagramAccountId}/subscribed_apps`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${connection.pageAccessToken}` },
      },
    ).catch(() => {});

    // Clear all Instagram channel configs in this org
    const orgInstagramChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(and(eq(channels.type, 'instagram'), eq(agents.orgId, orgId)));

    for (const ch of orgInstagramChannels) {
      await ChannelService.update(ch.id, {
        config: {},
        channelStatus: 'inactive',
        enabled: false,
      });
    }

    await InstagramConnectionService.delete(orgId);

    return { success: true };
  })

  // POST /instagram/bind — bind the Instagram account to an agent's channel
  .post(
    '/instagram/bind',
    async ({ body, orgId, status }) => {
      const channelAccess = await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(channelAccess.plan),
        });
      }

      const { channelId } = body;

      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel || channel.type !== 'instagram') {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Instagram channel not found',
        });
      }

      const connection = await InstagramConnectionService.findByOrg(orgId);
      if (!connection) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'No Instagram connection found',
        });
      }

      // Ensure no other channel in this org already has this account bound
      const existing = await db
        .select({ id: channels.id })
        .from(channels)
        .innerJoin(agents, eq(channels.agentId, agents.id))
        .where(
          and(
            eq(channels.type, 'instagram'),
            eq(agents.orgId, orgId),
            sql`${channels.config}->>'instagramAccountId' = ${connection.instagramAccountId}`,
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0].id !== channelId) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'This Instagram account is already assigned to another agent',
        });
      }

      const updated = await ChannelService.update(channelId, {
        config: {
          instagramAccountId: connection.instagramAccountId,
          username: connection.username,
        } satisfies IChannelInstagramConfig,
        channelStatus: 'active',
        enabled: true,
      });

      return { channel: ChannelService.transformChannel(updated) };
    },
    {
      body: t.Object({
        channelId: t.String(),
      }),
    },
  )

  // DELETE /instagram/bind/:channelId — unassign (connection stays)
  .delete('/instagram/bind/:channelId', async ({ params, orgId, status }) => {
    const channel = await ChannelService.single({ id: params.channelId, orgId });
    if (!channel || channel.type !== 'instagram') {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Instagram channel not found',
      });
    }

    const updated = await ChannelService.update(params.channelId, {
      config: {},
      channelStatus: 'inactive',
      enabled: false,
    });

    return { channel: ChannelService.transformChannel(updated) };
  });

// ─── Fire-and-forget: process inbound Instagram DM ──────────────────────────
async function processInboundMessage(body: unknown) {
  const payload = body as {
    object?: string;
    entry?: {
      id?: string; // Instagram Business Account ID (recipient)
      messaging?: {
        sender?: { id?: string };
        recipient?: { id?: string };
        message?: { mid?: string; text?: string };
      }[];
    }[];
  };

  if (payload.object !== 'instagram') return;

  for (const entry of payload.entry ?? []) {
    const instagramAccountId = entry.id;
    if (!instagramAccountId) continue;

    for (const messaging of entry.messaging ?? []) {
      const senderIgsid = messaging.sender?.id;
      const messageText = messaging.message?.text;
      const messageId = messaging.message?.mid;

      if (!senderIgsid || !messageText) continue;

      // Skip echo events (bot's own messages)
      if (senderIgsid === instagramAccountId) continue;

      const result = await ChannelService.findByInstagramAccountId(instagramAccountId);
      if (!result?.enabled || !result.agent) continue;

      await ChatService.sendInstagram({
        channelId: result.id,
        orgId: result.agent.orgId,
        senderIgsid,
        message: messageText,
        messageId,
      });
    }
  }
}
