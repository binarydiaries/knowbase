import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ConversationModel } from './model';
import { ConversationService } from './service';

export const Conversation = new Elysia({
  prefix: '/conversations',
  tags: ['Conversation'],
})
  .use(AuthGuard)
  .use(ConversationModel)
  .get(
    '',
    async ({ query, orgId }) => {
      return {
        conversations: await ConversationService.list({
          chatbotId: query.chatbotId,
          orgId,
        }),
      };
    },
    {
      query: 'ListConversation',
      response: 'ManyConversationResponse',
    },
  );
