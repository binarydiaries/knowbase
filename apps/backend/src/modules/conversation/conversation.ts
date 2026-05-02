import { Elysia } from 'elysia';
import z from 'zod';
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
      return ConversationService.list({
        agentId: query.agentId,
        orgId,
        channelId: query.channelId,
        page: query.page,
        limit: query.limit,
      });
    },
    {
      query: z.object({
        agentId: z.string().optional(),
        channelId: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
      }),
      response: 'ManyConversationResponse',
    },
  );
