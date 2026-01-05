import { Elysia } from 'elysia';
import { Model } from './model';
import { ChatService } from './service';

export const chat = new Elysia({ prefix: '/chat' }).use(Model).post(
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
);
