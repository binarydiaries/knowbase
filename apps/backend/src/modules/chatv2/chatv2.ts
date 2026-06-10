import { Elysia } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { ModelV2 } from './model';
import {
  ChatV2Service,
  DomainNotAllowedError,
  MessageLimitReachedError,
  NotFoundError,
} from './service';

function handleChatError(error: unknown, status: Function) {
  if (error instanceof NotFoundError) {
    return status(404, { code: 'NOT_FOUND', message: error.message });
  }
  if (error instanceof DomainNotAllowedError) {
    return status(403, { code: 'FORBIDDEN', message: error.message });
  }
  if (error instanceof MessageLimitReachedError) {
    return status(403, {
      code: 'MESSAGE_LIMIT_REACHED',
      message: error.message,
      plan: error.payload.plan,
      messagesPerMonthLimit: error.payload.messagesPerMonthLimit,
      messagesThisMonth: error.payload.messagesThisMonth,
    });
  }
  throw error;
}

export const ChatV2 = new Elysia({ prefix: '/chatv2', tags: ['Chats V2'] })
  .use(ModelV2)
  .use(ErrorModel)
  // ── Public web endpoint — no AuthGuard (customer-facing widget) ────────────
  .post(
    '',
    async ({ body, status, headers }) => {
      const { message, channelId, conversationId, parentOrigin } = body;
      const ip =
        (headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          ?.trim() ??
        (headers['x-real-ip'] as string | undefined) ??
        undefined;

      try {
        return await ChatV2Service.sendWeb({
          channelId,
          conversationId,
          message,
          parentOrigin,
          ip,
        });
      } catch (error) {
        return handleChatError(error, status);
      }
    },
    {
      body: 'ChatV2BodySchema',
      response: {
        200: z.any(),
        403: 'ChatForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  // ── Auth-guarded routes ────────────────────────────────────────────────────
  .use(AuthGuard)
  .post(
    '/preview',
    async ({ body, status, orgId }) => {
      const { message, channelId, conversationId } = body;

      const channel = await ChannelService.single({ id: channelId, orgId });
      if (!channel) {
        return status(404, { code: 'NOT_FOUND', message: 'Channel not found' });
      }

      try {
        return await ChatV2Service.sendPreview({
          agentId: channel.agentId,
          conversationId,
          channelId,
          message,
          orgId,
        });
      } catch (error) {
        return handleChatError(error, status);
      }
    },
    {
      body: 'ChatV2BodySchema',
      response: {
        200: z.any(),
        403: 'ChatForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  );
