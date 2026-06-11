import { and, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { db } from '../../db';
import { agents } from '../../db/schema/agents';
import { channels } from '../../db/schema/channels';
import type { IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ChatV2Service } from '../chatv2/service';
import { SubscriptionService } from '../subscription/service';
import { WhatsAppConnectionService } from './connectionService';
import { generateOrgVerifyToken, verifyOrgVerifyToken } from './verifyToken';

const BadRequestResponse = z.object({
  code: z.string(),
  message: z.string(),
});

export const WhatsApp = new Elysia({ tags: ['WhatsApp'] })
  .use(ErrorModel)

  // ─── GET /webhook/whatsapp — Meta challenge verification ───────────────────
  .get(
    '/webhook/whatsapp',
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

  // ─── POST /webhook/whatsapp — Inbound messages from Meta ──────────────────
  .post(
    '/webhook/whatsapp',
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

  // GET /whatsapp/setup-info — per-org webhook URL and unique verify token for Meta App setup
  .get('/whatsapp/setup-info', ({ orgId }) => {
    const verifyToken = generateOrgVerifyToken(orgId);
    const webhookUrl = `${process.env.API_BASE}/webhook/whatsapp`;
    return { webhookUrl, verifyToken };
  })

  // GET /whatsapp/test-connection — validate that the stored token still works against Meta
  .get('/whatsapp/test-connection', async ({ orgId, status }) => {
    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'No WhatsApp connection found',
      });
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${connection.businessAccountId}/phone_numbers?fields=display_phone_number,id`,
      { headers: { Authorization: `Bearer ${connection.accessToken}` } },
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return status(400, {
        code: 'BAD_REQUEST',
        message:
          err.error?.message ??
          'Token is invalid or access to this WABA has been revoked',
      });
    }

    const data = (await res.json()) as {
      data: { id: string; display_phone_number: string }[];
    };
    return { ok: true, phoneNumberCount: data.data.length };
  })

  // GET /whatsapp/connection — org's connection status + phone numbers with bindings
  .get('/whatsapp/connection', async ({ orgId }) => {
    const connection = await WhatsAppConnectionService.findByOrg(orgId);

    if (!connection) {
      return { connected: false, phoneNumbers: [] };
    }

    // Fetch live phone numbers from Meta
    let phoneNumbers: { phoneNumberId: string; displayPhone: string }[] = [];
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${connection.businessAccountId}/phone_numbers?fields=display_phone_number,id`,
        { headers: { Authorization: `Bearer ${connection.accessToken}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          data: { id: string; display_phone_number: string }[];
        };
        phoneNumbers = data.data.map((p) => ({
          phoneNumberId: p.id,
          displayPhone: p.display_phone_number,
        }));
      }
    } catch {
      // Best-effort — return connection status even if Meta is slow
    }

    // For each phone number, check which agent's channel has it bound
    const enriched = await Promise.all(
      phoneNumbers.map(async (phone) => {
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
              eq(channels.type, 'whatsapp'),
              eq(agents.orgId, orgId),
              sql`${channels.config}->>'phoneNumberId' = ${phone.phoneNumberId}`,
            ),
          )
          .limit(1);

        return {
          ...phone,
          boundToAgentId: bound[0]?.agentId ?? null,
          agentName: bound[0]?.agentName ?? null,
        };
      }),
    );

    return {
      connected: true,
      businessAccountId: connection.businessAccountId,
      phoneNumbers: enriched,
    };
  })

  // POST /whatsapp/connect — manual credential entry (accessToken + businessAccountId)
  .post(
    '/whatsapp/connect',
    async ({ body, orgId, status }) => {
      const channelAccess =
        await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(
            channelAccess.plan,
          ),
        });
      }

      const { accessToken, businessAccountId } = body;

      // 1. Verify credentials by fetching phone numbers (fails fast on bad token)
      const phoneRes = await fetch(
        `https://graph.facebook.com/v19.0/${businessAccountId}/phone_numbers?fields=display_phone_number,id`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!phoneRes.ok) {
        return status(400, {
          code: 'BAD_REQUEST',
          message:
            'Invalid credentials — could not reach WhatsApp Business Account',
        });
      }
      const phoneData = (await phoneRes.json()) as {
        data: { id: string; display_phone_number: string }[];
      };
      const phoneNumbers = phoneData.data.map((p) => ({
        phoneNumberId: p.id,
        displayPhone: p.display_phone_number,
      }));

      // 2. Subscribe WABA to our app to receive webhooks (best-effort)
      await fetch(
        `https://graph.facebook.com/v19.0/${businessAccountId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      // 3. Upsert org-level connection
      await WhatsAppConnectionService.upsert(orgId, {
        accessToken,
        businessAccountId,
      });

      return { businessAccountId, phoneNumbers };
    },
    {
      body: t.Object({
        accessToken: t.String(),
        businessAccountId: t.String(),
      }),
    },
  )

  // DELETE /whatsapp/connection — org-level disconnect
  .delete('/whatsapp/connection', async ({ orgId, status }) => {
    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'No WhatsApp connection found',
      });
    }

    // Unsubscribe WABA (best-effort)
    await fetch(
      `https://graph.facebook.com/v19.0/${connection.businessAccountId}/subscribed_apps`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${connection.accessToken}` },
      },
    ).catch(() => {});

    // Clear all WhatsApp channel configs in this org
    const orgWhatsAppChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(agents, eq(channels.agentId, agents.id))
      .where(and(eq(channels.type, 'whatsapp'), eq(agents.orgId, orgId)));

    for (const ch of orgWhatsAppChannels) {
      await ChannelService.update(ch.id, {
        config: {},
        channelStatus: 'inactive',
        enabled: false,
      });
    }

    // Delete the connection record
    await WhatsAppConnectionService.delete(orgId);

    return { success: true };
  })

  // POST /whatsapp/bind — bind a phone number to a agent's WhatsApp channel
  .post(
    '/whatsapp/bind',
    async ({ body, orgId, status }) => {
      const channelAccess =
        await SubscriptionService.assertPaidChannelAccess(orgId);
      if (!channelAccess.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: SubscriptionService.getPaidChannelMessage(
            channelAccess.plan,
          ),
        });
      }

      const { channelId, phoneNumberId, displayPhone } = body;

      // Validate channel belongs to org and is whatsapp type
      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel || channel.type !== 'whatsapp') {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'WhatsApp channel not found',
        });
      }

      // Validate no other channel in org already has this phoneNumberId
      const existing = await db
        .select({ id: channels.id })
        .from(channels)
        .innerJoin(agents, eq(channels.agentId, agents.id))
        .where(
          and(
            eq(channels.type, 'whatsapp'),
            eq(agents.orgId, orgId),
            sql`${channels.config}->>'phoneNumberId' = ${phoneNumberId}`,
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0].id !== channelId) {
        return status(400, {
          code: 'BAD_REQUEST',
          message: 'This phone number is already assigned to another agent',
        });
      }

      const updated = await ChannelService.update(channelId, {
        config: {
          phoneNumberId,
          displayPhone,
        } satisfies IChannelWhatsAppConfig,
        channelStatus: 'active',
        enabled: true,
      });

      return { channel: ChannelService.transformChannel(updated) };
    },
    {
      body: t.Object({
        channelId: t.String(),
        phoneNumberId: t.String(),
        displayPhone: t.String(),
      }),
    },
  )

  // DELETE /whatsapp/bind/:channelId — unassign number (WABA stays connected)
  .delete('/whatsapp/bind/:channelId', async ({ params, orgId, status }) => {
    const channel = await ChannelService.single({
      id: params.channelId,
      orgId,
    });
    if (!channel || channel.type !== 'whatsapp') {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'WhatsApp channel not found',
      });
    }

    const updated = await ChannelService.update(params.channelId, {
      config: {},
      channelStatus: 'inactive',
      enabled: false,
    });

    return { channel: ChannelService.transformChannel(updated) };
  });

// ─── Fire-and-forget: process inbound WhatsApp message ──────────────────────
async function processInboundMessage(body: unknown) {
  const payload = body as {
    object?: string;
    entry?: {
      changes?: {
        value?: {
          metadata?: { phone_number_id?: string };
          messages?: {
            id?: string;
            from?: string;
            type?: string;
            text?: { body?: string };
          }[];
        };
      }[];
    }[];
  };

  if (payload.object !== 'whatsapp_business_account') return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      const messages = value?.messages ?? [];

      for (const msg of messages) {
        if (
          msg.type !== 'text' ||
          !msg.from ||
          !msg.text?.body ||
          !phoneNumberId
        ) {
          continue;
        }

        const result =
          await ChannelService.findByWhatsappPhoneNumberId(phoneNumberId);
        if (!result?.enabled || !result.agent) continue;

        await ChatV2Service.sendWhatsApp({
          channelId: result.id,
          orgId: result.agent.orgId,
          senderPhone: msg.from,
          message: msg.text.body,
          messageId: msg.id,
        });
      }
    }
  }
}
