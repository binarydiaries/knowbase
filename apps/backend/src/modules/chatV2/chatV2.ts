import { Elysia } from 'elysia';
import type { Context } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ChannelService } from '../channel/service';
import { Model } from './model';
import {
  ChatV2Service,
  V2ForbiddenError,
  V2LimitError,
  V2NotFoundError,
} from './service';

function handleError(err: unknown, status: Function) {
  if (err instanceof V2NotFoundError)
    return status(404, { code: 'NOT_FOUND', message: err.message });
  if (err instanceof V2ForbiddenError)
    return status(403, { code: 'FORBIDDEN', message: err.message });
  if (err instanceof V2LimitError)
    return status(403, {
      code: 'MESSAGE_LIMIT_REACHED',
      message: err.message,
      ...err.payload,
    });
  throw err;
}

function getClientIp(headers: Context['headers']): string | undefined {
  return (
    (headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    (headers['x-real-ip'] as string | undefined) ??
    undefined
  );
}

export const ChatV2 = new Elysia({ prefix: '/v2/chat', tags: ['Chats V2'] })
  .use(Model)

  .post(
    '/web',
    async ({ body, status, headers, set }) => {
      try {
        const stream = await ChatV2Service.sendWeb({ ...body, ip: getClientIp(headers) });
        set.headers['Content-Type'] = 'text/event-stream';
        set.headers['Cache-Control'] = 'no-cache';
        set.headers['Connection'] = 'keep-alive';
        return stream;
      } catch (err) {
        return handleError(err, status);
      }
    },
    { body: 'WebChatBodySchema' },
  )

  .post(
    '/whatsapp',
    async ({ body, status, headers }) => {
      try {
        await ChatV2Service.sendWhatsApp({ ...body, ip: getClientIp(headers) });
        return { ok: true };
      } catch (err) {
        return handleError(err, status);
      }
    },
    { body: 'WhatsAppChatBodySchema' },
  )

  .post(
    '/slack',
    async ({ body, status, headers }) => {
      try {
        await ChatV2Service.sendSlack({ ...body, ip: getClientIp(headers) });
        return { ok: true };
      } catch (err) {
        return handleError(err, status);
      }
    },
    { body: 'SlackChatBodySchema' },
  )

  // ── Authenticated preview (dashboard) ─────────────────────────────────────
  .use(AuthGuard)

  .post(
    '/preview',
    async ({ body, status, orgId, set }) => {
      const { message, channelId, conversationId } = body;

      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel) return status(404, { code: 'NOT_FOUND', message: 'Channel not found' });

      try {
        const { conversationId: resolvedId } = await ChatV2Service.findOrCreate({
          channelId,
          agentId: channel.agentId,
          conversationId,
          orgId,
          firstUserMessage: message,
        });

        const stream = await ChatV2Service.stream({
          agentId: channel.agentId,
          conversationId: resolvedId,
          channelId,
          orgId,
          message,
        });

        set.headers['Content-Type'] = 'text/event-stream';
        set.headers['Cache-Control'] = 'no-cache';
        set.headers['Connection'] = 'keep-alive';
        return stream;
      } catch (err) {
        return handleError(err, status);
      }
    },
    { body: 'PreviewBodySchema' },
  );
