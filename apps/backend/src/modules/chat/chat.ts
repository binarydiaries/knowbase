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
        message: {
          id: message.id,
          role: 'user',
          parts: [
            {
              type: 'text',
              text: message.text,
            },
          ],
        },
      });
    },
    {
      body: 'ChatBody',
    },
  )
  .post(
    '/2',
    async ({ body }) => {
      const { id, message } = body;
      return ChatService.send2({
        conversationId: id,
        message: message.text,
      });
    },
    {
      body: 'ChatBody',
    },
  );
