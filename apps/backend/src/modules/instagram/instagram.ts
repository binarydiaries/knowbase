import { randomUUID } from 'crypto';
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

// ─── Temporary in-memory store for multi-account OAuth selection ─────────────
// Keys expire after 10 minutes. Entries are created when a user has multiple
// Instagram-linked pages and needs to pick one before we store the connection.

interface PendingAccount {
  instagramAccountId: string;
  username: string;
  pageName: string;
  pageAccessToken: string;
}
interface PendingOAuth {
  orgId: string;
  accounts: PendingAccount[];
  expiresAt: number;
}
const pendingOAuthStore = new Map<string, PendingOAuth>();

function evictExpiredPending() {
  const now = Date.now();
  for (const [key, val] of pendingOAuthStore) {
    if (val.expiresAt < now) pendingOAuthStore.delete(key);
  }
}

// Shared Meta Graph API base
const GRAPH = 'https://graph.facebook.com/v19.0';

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

  // POST /instagram/oauth/exchange — trade OAuth code for connection
  .post(
    '/instagram/oauth/exchange',
    async ({ body, orgId, status }) => {
      const channelAccess = await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(channelAccess.plan),
        });
      }

      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;
      if (!appId || !appSecret) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'Facebook OAuth is not configured on this server',
        });
      }

      const { code, redirectUri } = body;

      // 1. Exchange code for short-lived user token
      const tokenRes = await fetch(
        `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`,
      );
      if (!tokenRes.ok) {
        const err = (await tokenRes.json().catch(() => ({}))) as { error?: { message?: string } };
        return status(400, {
          code: 'BAD_REQUEST',
          message: err.error?.message ?? 'Failed to exchange OAuth code',
        });
      }
      const { access_token: shortToken } = (await tokenRes.json()) as { access_token: string };

      // 2. Exchange for long-lived user token (60-day)
      const longTokenRes = await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
      );
      if (!longTokenRes.ok) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'Failed to get long-lived user token',
        });
      }
      const { access_token: longUserToken } = (await longTokenRes.json()) as { access_token: string };

      // 3. Fetch pages the user manages, each with their Page Access Token and
      //    linked Instagram Business Account
      const pagesRes = await fetch(
        `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username}&access_token=${longUserToken}`,
      );
      if (!pagesRes.ok) {
        return status(400, { code: 'BAD_REQUEST', message: 'Failed to fetch Facebook Pages' });
      }
      const pagesData = (await pagesRes.json()) as {
        data: {
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: { id: string; name?: string; username?: string };
        }[];
      };

      const linkedAccounts: PendingAccount[] = pagesData.data
        .filter((p) => !!p.instagram_business_account)
        .map((p) => ({
          instagramAccountId: p.instagram_business_account!.id,
          username: p.instagram_business_account!.username ?? p.instagram_business_account!.name ?? p.instagram_business_account!.id,
          pageName: p.name,
          pageAccessToken: p.access_token,
        }));

      if (linkedAccounts.length === 0) {
        return status(400, {
          code: 'BAD_REQUEST',
          message:
            'No Instagram Business Account linked to your Facebook Pages. ' +
            'Make sure your Instagram account is set to Business/Creator and connected to a Facebook Page.',
        });
      }

      // 4a. Exactly one account — store immediately
      if (linkedAccounts.length === 1) {
        const account = linkedAccounts[0];
        await subscribeToWebhooks(account.instagramAccountId, account.pageAccessToken);
        await InstagramConnectionService.upsert(orgId, {
          pageAccessToken: account.pageAccessToken,
          instagramAccountId: account.instagramAccountId,
          username: account.username,
        });
        return {
          connected: true as const,
          instagramAccountId: account.instagramAccountId,
          username: account.username,
        };
      }

      // 4b. Multiple accounts — stash tokens, return options for user to pick
      evictExpiredPending();
      const pendingKey = randomUUID();
      pendingOAuthStore.set(pendingKey, {
        orgId,
        accounts: linkedAccounts,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return {
        connected: false as const,
        pendingKey,
        accounts: linkedAccounts.map(({ instagramAccountId, username, pageName }) => ({
          instagramAccountId,
          username,
          pageName,
        })),
      };
    },
    {
      body: t.Object({
        code: t.String(),
        redirectUri: t.String(),
      }),
    },
  )

  // POST /instagram/oauth/confirm — select from multiple accounts returned by /exchange
  .post(
    '/instagram/oauth/confirm',
    async ({ body, orgId, status }) => {
      const { pendingKey, instagramAccountId } = body;

      evictExpiredPending();
      const pending = pendingOAuthStore.get(pendingKey);

      if (!pending || pending.orgId !== orgId || pending.expiresAt < Date.now()) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'OAuth session expired or invalid. Please connect again.',
        });
      }

      const account = pending.accounts.find((a) => a.instagramAccountId === instagramAccountId);
      if (!account) {
        return status(400, { code: 'BAD_REQUEST', message: 'Account not found in session' });
      }

      pendingOAuthStore.delete(pendingKey);

      await subscribeToWebhooks(account.instagramAccountId, account.pageAccessToken);
      await InstagramConnectionService.upsert(orgId, {
        pageAccessToken: account.pageAccessToken,
        instagramAccountId: account.instagramAccountId,
        username: account.username,
      });

      return {
        instagramAccountId: account.instagramAccountId,
        username: account.username,
      };
    },
    {
      body: t.Object({
        pendingKey: t.String(),
        instagramAccountId: t.String(),
      }),
    },
  )

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

      await subscribeToWebhooks(instagramAccountId, pageAccessToken);

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

// ─── Helpers ────────────────────────────────────────────────────────────────

async function subscribeToWebhooks(instagramAccountId: string, pageAccessToken: string) {
  await fetch(
    `${GRAPH}/${instagramAccountId}/subscribed_apps?subscribed_fields=messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    },
  ).catch(() => {});
}

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
