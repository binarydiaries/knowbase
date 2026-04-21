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
        query.agentId,
      );
    },
    {
      query: 'MessagesDailyQuerySchema',
      response: 'MessagesDailyResponseSchema',
    },
  )
  .get(
    '/messages-by-agent',
    async ({ query, orgId }) => {
      return UsageChartsService.getMessagesByAgent(
        orgId,
        query.startDate,
        query.endDate,
        query.agentId,
      );
    },
    {
      query: 'MessagesByAgentQuerySchema',
      response: 'MessagesByAgentResponseSchema',
    },
  )
  .get(
    '/knowledge-by-agent',
    async ({ query, orgId }) => {
      return UsageChartsService.getKnowledgeByAgent(orgId, query.agentId);
    },
    {
      query: 'KnowledgeByAgentQuerySchema',
      response: 'KnowledgeByAgentResponseSchema',
    },
  );
