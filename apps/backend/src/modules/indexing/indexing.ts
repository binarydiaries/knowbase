import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { addIndexDocumentJob } from '../../queue/indexing/indexing.queue';
import { ChatbotService } from '../chatbot/service';
import { DocumentService } from '../document/service';
import { SubscriptionService } from '../subscription/service';
import { OrgUsageDailyService } from '../subscription/usage';
import { IndexingModel } from './model';

export const Indexing = new Elysia({
  prefix: '/indexing',
  tags: ['Indexing'],
})
  .use(AuthGuard)
  .use(IndexingModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, status, orgId }) => {
      const chatbot = await ChatbotService.single({
        id: body.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      if (
        SubscriptionService.hasReachedTrainingRunsPerDayLimit(subscription)
      ) {
        return status(403, {
          code: 'TRAINING_LIMIT_REACHED',
          message: SubscriptionService.getTrainingLimitReachedMessage(
            subscription,
          ),
          plan: subscription.plan,
          trainingRunsPerDayLimit: subscription.trainingRunsPerDayLimit,
          trainingRunsToday: subscription.trainingRunsToday,
        });
      }

      await OrgUsageDailyService.incrementTodayTrainingRuns(orgId);

      const documents = await DocumentService.list({
        chatbotId: body.chatbotId,
        orgId,
        filter: { status: ['ready'] },
      });

      await Promise.all(
        documents.map(async (doc) => {
          return await addIndexDocumentJob({
            orgId,
            documentId: doc.id,
            version: doc.version,
          });
        }),
      );

      return status(202, {
        message: 'Indexing Started',
      });
    },
    {
      body: 'IndexingStartBody',
      response: {
        202: 'IndexingStartResponse',
        403: 'IndexingForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '/status',
    async ({ query, orgId }) => {
      const documents = await DocumentService.list({
        chatbotId: query.chatbotId,
        orgId,
      });

      return {
        documentIds: documents.map((doc) => {
          return {
            id: doc.id,
            updatedAt: doc.updatedAt,
            status: doc.status,
          };
        }),
        isPollingActive: !!documents.find(
          (document) =>
            document.status === 'queue' || document.status === 'indexing',
        ),
      };
    },
    {
      query: z.object({
        chatbotId: z.string(),
      }),
      response: 'IndexingStatusResponse',
    },
  );
