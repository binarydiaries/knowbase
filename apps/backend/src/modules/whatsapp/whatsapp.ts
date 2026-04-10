import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import type { IChannelWhatsAppConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { ChatService } from '../chat/service';

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

      if (
        mode === 'subscribe' &&
        token === process.env.WHATSAPP_PLATFORM_VERIFY_TOKEN
      ) {
        return new Response(challenge ?? '', { status: 200 });
      }

      return new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'Invalid verify token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
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
      // Acknowledge immediately — Meta requires a fast 200 response
      void processInboundMessage(body).catch(console.error);
      return new Response('OK', { status: 200 });
    },
    {
      body: t.Any(),
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

  // POST /whatsapp/connect — OAuth exchange after Embedded Signup
  .post(
    '/whatsapp/connect',
    async ({ body, orgId, status }) => {
      const { code, channelId } = body;

      // 1. Validate channel belongs to this org
      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel || channel.type !== 'whatsapp') {
        return status(404, { code: 'NOT_FOUND', message: 'WhatsApp channel not found' });
      }

      // 2. Exchange code → short-lived user access token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
          `?client_id=${process.env.FACEBOOK_APP_ID}` +
          `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
          `&code=${code}`,
      );
      if (!tokenRes.ok) {
        return status(400, { code: 'BAD_REQUEST', message: 'Failed to exchange OAuth code' });
      }
      const { access_token: accessToken } = (await tokenRes.json()) as {
        access_token: string;
      };

      // 3. Get WABA ID from granular_scopes
      const meRes = await fetch(
        'https://graph.facebook.com/v19.0/me?fields=granular_scopes',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!meRes.ok) {
        return status(400, { code: 'BAD_REQUEST', message: 'Failed to fetch WABA info' });
      }
      const meData = (await meRes.json()) as {
        granular_scopes?: { scope: string; target_ids?: string[] }[];
      };
      const wabaId = meData.granular_scopes
        ?.find((s) => s.scope === 'whatsapp_business_management')
        ?.target_ids?.[0];

      if (!wabaId) {
        return status(400, { code: 'BAD_REQUEST', message: 'No WhatsApp Business Account found' });
      }

      // 4. Get phone number details
      const phoneRes = await fetch(
        `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?fields=display_phone_number,id`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!phoneRes.ok) {
        return status(400, { code: 'BAD_REQUEST', message: 'Failed to fetch phone number' });
      }
      const phoneData = (await phoneRes.json()) as {
        data: { id: string; display_phone_number: string }[];
      };
      const phone = phoneData.data[0];
      if (!phone) {
        return status(400, { code: 'BAD_REQUEST', message: 'No phone number found in WABA' });
      }

      // 5. Subscribe WABA to our app (automated — no user action needed)
      await fetch(`https://graph.facebook.com/v19.0/${wabaId}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // 6. Save config
      const config: IChannelWhatsAppConfig = {
        phoneNumberId: phone.id,
        accessToken,
        businessAccountId: wabaId,
        displayPhone: phone.display_phone_number,
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
        code: t.String(),
        channelId: t.String(),
      }),
    },
  )

  // DELETE /whatsapp/connect/:channelId — Disconnect WhatsApp
  .delete(
    '/whatsapp/connect/:channelId',
    async ({ params, orgId, status }) => {
      const channel = await ChannelService.single({
        id: params.channelId,
        orgId,
      });
      if (!channel || channel.type !== 'whatsapp') {
        return status(404, { code: 'NOT_FOUND', message: 'WhatsApp channel not found' });
      }

      const config = channel.config as IChannelWhatsAppConfig;

      // Unsubscribe WABA from our app (best-effort)
      if (config.businessAccountId && config.accessToken) {
        await fetch(
          `https://graph.facebook.com/v19.0/${config.businessAccountId}/subscribed_apps`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${config.accessToken}` },
          },
        ).catch(() => {
          // Unsubscribe is best-effort — don't block disconnect if it fails
        });
      }

      const updated = await ChannelService.update(params.channelId, {
        config: {},
        channelStatus: 'inactive',
        enabled: false,
      });

      return { channel: ChannelService.transformChannel(updated) };
    },
  );

// ─── Fire-and-forget: process inbound WhatsApp message ──────────────────────
async function processInboundMessage(body: unknown) {
  const payload = body as {
    object?: string;
    entry?: {
      changes?: {
        value?: {
          metadata?: { phone_number_id?: string };
          messages?: { from?: string; type?: string; text?: { body?: string } }[];
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
        if (msg.type !== 'text' || !msg.from || !msg.text?.body || !phoneNumberId) {
          continue;
        }

        const result = await ChannelService.findByWhatsappPhoneNumberId(phoneNumberId);
        if (!result?.enabled || !result.chatbot) continue;

        await ChatService.sendWhatsApp({
          channelId: result.id,
          orgId: result.chatbot.orgId,
          senderPhone: msg.from,
          message: msg.text.body,
        });
      }
    }
  }
}
