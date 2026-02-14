import { Elysia } from 'elysia';
import { ChannelService } from '../channel/service';
import { Model } from './model';
import { ChatService } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .post(
    '',
    async ({ body }) => {
      const { message, channelId, conversationId, orgId } = body;
      return ChatService.sendWeb({
        conversationId,
        message: message,
        channelId,
        orgId,
      });
    },
    {
      body: 'ChatBodySchema',
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
