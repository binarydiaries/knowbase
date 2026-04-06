import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { UsageChartsModel } from './model';
import { UsageChartsService } from './service';

export const UsageCharts = new Elysia({
  prefix: '/usage',
  tags: ['Usage'],
})
  .use(AuthGuard)
  .use(UsageChartsModel)
  .get(
    '/messages-daily',
    async ({ query, orgId }) => {
      return UsageChartsService.getMessagesDaily(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'MessagesDailyQuerySchema',
      response: 'MessagesDailyResponseSchema',
    },
  )
  .get(
    '/messages-by-chatbot',
    async ({ query, orgId }) => {
      return UsageChartsService.getMessagesByChatbot(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'MessagesByChatbotQuerySchema',
      response: 'MessagesByChatbotResponseSchema',
    },
  )
  .get(
    '/knowledge-by-chatbot',
    async ({ query, orgId }) => {
      return UsageChartsService.getKnowledgeByChatbot(orgId, query.chatbotId);
    },
    {
      query: 'KnowledgeByChatbotQuerySchema',
      response: 'KnowledgeByChatbotResponseSchema',
    },
  );
