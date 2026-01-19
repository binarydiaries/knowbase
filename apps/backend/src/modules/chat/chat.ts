import { Elysia } from 'elysia';
import { Model } from './model';
import { ChatService } from './service';

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .post(
    '',
    async ({ body }) => {
      const { id, message } = body;
      return ChatService.send({
        conversationId: id,
        message: message.text,
      });
    },
    {
      body: 'ChatBody',
    },
  );
