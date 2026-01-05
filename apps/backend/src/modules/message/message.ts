import { Elysia } from 'elysia';
import { MessageModel } from './model';
import { MessageService } from './service';

export const message = new Elysia({ prefix: '/message' }).use(MessageModel).get(
  '',
  async ({ query }) => {
    return MessageService.getMessages(query.conversationId);
  },
  {
    query: 'GetMessageQuery',
  },
);
