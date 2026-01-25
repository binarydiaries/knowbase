import { Elysia } from 'elysia';
import { ConversationModel } from './model';
import { ConversationService } from './service';

export const Conversation = new Elysia({
  prefix: '/conversations',
  tags: ['Conversation'],
})
  .use(ConversationModel)
  .get(
    '',
    async ({ query }) => {
      return {
        conversations: await ConversationService.list({
          chatbotId: query.chatbotId,
        }),
      };
    },
    {
      query: 'ListConversation',
      response: 'ManyConversationResponse',
    },
  );
