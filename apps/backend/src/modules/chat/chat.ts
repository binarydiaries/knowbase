import { Elysia } from 'elysia';
import { Model } from './model';
import { ChatService } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .post(
    '',
    async ({ body }) => {
      const { message, channelId, conversationId } = body;
      return ChatService.sendWeb({
        conversationId,
        message: message,
        channelId,
      });
    },
    {
      body: 'ChatBody',
    },
  );
