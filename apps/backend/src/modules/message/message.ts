import { Elysia } from 'elysia';
import z from 'zod';
import { MessageModel } from './model';
import { MessageService } from './service';

export const message = new Elysia({ prefix: '/messages', tags: ['Message'] })
  .use(MessageModel)
  .get(
    '',
    async ({ query }) => {
      return {
        messages: await MessageService.getMessages(query.conversationId),
      };
    },
    {
      query: z.object({
        conversationId: z.string(),
      }),
      response: 'ManyMessageResponse',
    },
  );
