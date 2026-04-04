import { Elysia } from 'elysia';
import { z } from 'zod';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { Model } from './model';
import { ChatService, MessageLimitReachedError } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, status }) => {
      const { message, channelId, conversationId, orgId } = body;

      try {
        return await ChatService.sendWeb({
          conversationId,
          message: message,
          channelId,
          orgId,
        });
      } catch (error) {
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
      },
    },
  )
  .get(
    '/channel',
    async ({ query }) => {
      const channel = await ChannelService.single({
        id: query.channelId,
        orgId: query.orgId,
      });

      if (!channel) {
        throw new Error('Channel not found or Invalid');
      }

      return {
        channel: ChannelService.transformChannel(channel),
      };
    },
    {
      query: 'ChatChannelQueryParamSchema',
      response: 'ChatChannelResponseSchema',
    },
  );
