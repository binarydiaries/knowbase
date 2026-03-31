import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { MessageModel } from './model';
import { MessageService } from './service';

export const message = new Elysia({ prefix: '/messages', tags: ['Message'] })
  .use(AuthGuard)
  .use(MessageModel)
  .get(
    '',
    async ({ query, orgId }) => {
      return {
        messages: await MessageService.getMessages({
          conversationId: query.conversationId,
          orgId,
        }),
      };
    },
    {
      query: z.object({
        conversationId: z.string(),
      }),
      response: 'ManyMessageResponse',
    },
  );
