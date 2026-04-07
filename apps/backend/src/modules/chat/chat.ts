import { Elysia } from 'elysia';
import { z } from 'zod';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { Model } from './model';
import { ChatService, MessageLimitReachedError, NotFoundError } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, status, headers }) => {
      const { message, channelId, conversationId, orgId } = body;
      const ip =
        (headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          ?.trim() ??
        (headers['x-real-ip'] as string | undefined) ??
        undefined;

      try {
        return await ChatService.sendWeb({
          conversationId,
          message: message,
          channelId,
          orgId,
          ip,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, { code: 'NOT_FOUND', message: error.message });
        }

        if (!(error instanceof MessageLimitReachedError)) {
          throw error;
        }

        return status(403, {
          code: 'MESSAGE_LIMIT_REACHED',
          message: error.message,
          plan: error.payload.plan,
          messagesPerMonthLimit: error.payload.messagesPerMonthLimit,
          messagesThisMonth: error.payload.messagesThisMonth,
        });
      }
    },
    {
      body: 'ChatBodySchema',
      response: {
        200: z.any(),
        403: 'ChatForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '/channel',
    async ({ query, status }) => {
      const channel = await ChannelService.single({
        id: query.channelId,
        orgId: query.orgId,
      });

      if (!channel) {
        return status(404, { code: 'NOT_FOUND', message: 'Channel not found or Invalid' });
      }

      return {
        channel: ChannelService.transformChannel(channel),
      };
    },
    {
      query: 'ChatChannelQueryParamSchema',
      response: {
        200: 'ChatChannelResponseSchema',
        404: 'NotFoundResponse',
      },
    },
  );
