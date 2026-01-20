import { Elysia } from 'elysia';
import { Model } from './model';
import { ChatService } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .post(
    '',
    async ({ body }) => {
      const { message, chatbotId, conversationId } = body;
      return ChatService.send({
        conversationId,
        message: message,
        channel: 'web',
        chatbotId,
      });
    },
    {
      body: 'ChatBody',
    },
  );
