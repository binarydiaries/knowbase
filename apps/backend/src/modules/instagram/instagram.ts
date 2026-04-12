import { and, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { db } from '../../db';
import { channels } from '../../db/schema/channels';
import { chatbots } from '../../db/schema/chatbots';
import type { IChannelInstagramConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';
import { InstagramConnectionService } from './connectionService';

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

      if (
        mode === 'subscribe' &&
        token === process.env.INSTAGRAM_PLATFORM_VERIFY_TOKEN
      ) {
        return new Response(challenge ?? '', { status: 200 });
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

  // ─── POST /webhook/instagram — Inbound messages from Meta ─────────────────
  .post(
    '/webhook/instagram',
    async ({ body }) => {
      console.log('===instagram===', JSON.stringify(body));
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

  // GET /instagram/connection — org's connection status + account info + binding
  .get('/instagram/connection', async ({ orgId }) => {
    const connection = await InstagramConnectionService.findByOrg(orgId);

    if (!connection) {
      return { connected: false };
    }

    // Fetch live account info from Meta
    let username: string | null = null;
    let name: string | null = null;
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${connection.instagramAccountId}?fields=name,username&access_token=${connection.pageAccessToken}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { name?: string; username?: string };
        username = data.username ?? null;
        name = data.name ?? null;
      }
    } catch {
      // Best-effort
    }

    // Check which chatbot (if any) has this pageId bound
    const bound = await db
      .select({
        chatbotId: chatbots.id,
        chatbotName: chatbots.name,
      })
      .from(channels)
      .innerJoin(chatbots, eq(channels.chatbotId, chatbots.id))
      .where(
        and(
          eq(channels.type, 'instagram'),
          eq(chatbots.orgId, orgId),
          sql`${channels.config}->>'pageId' = ${connection.pageId}`,
        ),
      )
      .limit(1);

    return {
      connected: true,
      pageId: connection.pageId,
      instagramAccountId: connection.instagramAccountId,
      username,
      name,
      boundToChatbotId: bound[0]?.chatbotId ?? null,
      chatbotName: bound[0]?.chatbotName ?? null,
    };
  })

  // POST /instagram/connect — save org-level credentials
  .post(
    '/instagram/connect',
    async ({ body, orgId, status }) => {
      const { pageAccessToken, pageId, instagramAccountId } = body;

      // 1. Validate credentials
      const accountRes = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=name,username&access_token=${pageAccessToken}`,
      );
      if (!accountRes.ok) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'Invalid credentials — could not reach Instagram account',
        });
      }
      const accountData = (await accountRes.json()) as {
        name?: string;
        username?: string;
      };

      // 2. Subscribe page to receive webhook events (best-effort)
      await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages&access_token=${pageAccessToken}`,
        { method: 'POST' },
      ).catch(() => {});

      // 3. Upsert org-level connection
      await InstagramConnectionService.upsert(orgId, {
        pageAccessToken,
        pageId,
        instagramAccountId,
      });

      return {
        pageId,
        instagramAccountId,
        username: accountData.username ?? null,
        name: accountData.name ?? null,
      };
    },
    {
      body: t.Object({
        pageAccessToken: t.String(),
        pageId: t.String(),
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

    // Unsubscribe page (best-effort)
    await fetch(
      `https://graph.facebook.com/v19.0/${connection.pageId}/subscribed_apps?access_token=${connection.pageAccessToken}`,
      { method: 'DELETE' },
    ).catch(() => {});

    // Clear all Instagram channel configs in this org
    const orgInstagramChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(chatbots, eq(channels.chatbotId, chatbots.id))
      .where(and(eq(channels.type, 'instagram'), eq(chatbots.orgId, orgId)));

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

  // POST /instagram/bind — bind this org's Instagram account to a chatbot channel
  .post(
    '/instagram/bind',
    async ({ body, orgId, status }) => {
      const { channelId } = body;

      // Validate channel belongs to org and is instagram type
      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel || channel.type !== 'instagram') {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Instagram channel not found',
        });
      }

      const connection = await InstagramConnectionService.findByOrg(orgId);
      if (!connection) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'No Instagram connection found for this org',
        });
      }

      // Validate no other channel in this org is already bound to this pageId
      const existing = await db
        .select({ id: channels.id })
        .from(channels)
        .innerJoin(chatbots, eq(channels.chatbotId, chatbots.id))
        .where(
          and(
            eq(channels.type, 'instagram'),
            eq(chatbots.orgId, orgId),
            sql`${channels.config}->>'pageId' = ${connection.pageId}`,
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0].id !== channelId) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'This Instagram account is already assigned to another chatbot',
        });
      }

      // Fetch username for display
      let instagramUsername: string | undefined;
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${connection.instagramAccountId}?fields=username&access_token=${connection.pageAccessToken}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { username?: string };
          instagramUsername = data.username;
        }
      } catch {
        // Best-effort
      }

      const updated = await ChannelService.update(channelId, {
        config: {
          pageId: connection.pageId,
          instagramUsername,
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

  // DELETE /instagram/bind/:channelId — unbind (connection stays)
  .delete('/instagram/bind/:channelId', async ({ params, orgId, status }) => {
    const channel = await ChannelService.single({
      id: params.channelId,
      orgId,
    });
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
      id?: string; // pageId
      messaging?: {
        sender?: { id?: string };
        recipient?: { id?: string };
        message?: { mid?: string; text?: string };
      }[];
    }[];
  };

  if (payload.object !== 'instagram') return;

  for (const entry of payload.entry ?? []) {
    const pageId = entry.id;

    for (const event of entry.messaging ?? []) {
      const senderPsid = event.sender?.id;
      const text = event.message?.text;

      // Skip echo events (page messaging itself) and non-text events
      if (!senderPsid || !text || !pageId || senderPsid === pageId) continue;

      const result = await ChannelService.findByInstagramPageId(pageId);
      if (!result?.enabled || !result.chatbot) continue;

      await ChatService.sendInstagram({
        channelId: result.id,
        orgId: result.chatbot.orgId,
        senderPsid,
        message: text,
      });
    }
  }
}
