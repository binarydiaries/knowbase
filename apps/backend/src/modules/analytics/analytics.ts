import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { AnalyticsModel } from './model';
import { AnalyticsService } from './service';

export const Analytics = new Elysia({
  prefix: '/analytics',
  tags: ['Analytics'],
})
  .use(AuthGuard)
  .use(AnalyticsModel)
  .get(
    '/overview',
    async ({ orgId }) => {
      return AnalyticsService.getOverview(orgId);
    },
    {
      response: 'AnalyticsOverviewResponseSchema',
    },
  )
  .get(
    '/conversations-daily',
    async ({ query, orgId }) => {
      return AnalyticsService.getConversationsDaily(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'ConversationsDailyQuerySchema',
      response: 'ConversationsDailyResponseSchema',
    },
  )
  .get(
    '/messages-by-channel',
    async ({ query, orgId }) => {
      return AnalyticsService.getMessagesByChannel(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'MessagesByChannelQuerySchema',
      response: 'MessagesByChannelResponseSchema',
    },
  )
  .get(
    '/top-chatbots',
    async ({ query, orgId }) => {
      return AnalyticsService.getTopChatbots(
        orgId,
        query.startDate,
        query.endDate,
      );
    },
    {
      query: 'TopChatbotsQuerySchema',
      response: 'TopChatbotsResponseSchema',
    },
  )
  .get(
    '/sentiment',
    async ({ query, orgId }) => {
      return AnalyticsService.getSentimentBreakdown(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'SentimentQuerySchema',
      response: 'SentimentResponseSchema',
    },
  )
  .get(
    '/top-topics',
    async ({ query, orgId }) => {
      return AnalyticsService.getTopTopics(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'TopTopicsQuerySchema',
      response: 'TopTopicsResponseSchema',
    },
  )
  .get(
    '/country-distribution',
    async ({ query, orgId }) => {
      return AnalyticsService.getCountryDistribution(
        orgId,
        query.startDate,
        query.endDate,
        query.chatbotId,
      );
    },
    {
      query: 'CountryDistributionQuerySchema',
      response: 'CountryDistributionResponseSchema',
    },
  );
