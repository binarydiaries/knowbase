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

function handleChatError(
  error: unknown,
  status: (code: number, body: { code: string; message: string }) => unknown,
) {
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
    });
  }
  throw error;
}

export const ChatV2 = new Elysia({ prefix: '/chatv2', tags: ['Chats V2'] })
  .use(ModelV2)
  .use(ErrorModel)
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
