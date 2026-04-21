import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { addIndexDocumentJob } from '../../queue/indexing/indexing.queue';
import { AgentService } from '../agent/service';
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
      const agent = await AgentService.single({
        id: body.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      const documents = await DocumentService.list({
        agentId: body.agentId,
        orgId,
        filter: { status: ['ready'] },
      });

      if (documents.length === 0) {
        return status(200, {
          status: 'no_documents_ready',
          message: 'No knowledge sources are ready to train.',
        });
      }

      const trainingRun = await OrgUsageDailyService.tryConsumeTrainingRun(
        orgId,
        subscription.trainingRunsPerDayLimit,
      );

      if (!trainingRun.allowed) {
        return status(403, {
          code: 'TRAINING_LIMIT_REACHED',
          message: SubscriptionService.getTrainingLimitReachedMessage({
            ...subscription,
            trainingRunsToday: trainingRun.trainingRunsToday,
            hasReachedTrainingRunsPerDayLimit: true,
          }),
          plan: subscription.plan,
          trainingRunsPerDayLimit: subscription.trainingRunsPerDayLimit,
          trainingRunsToday: trainingRun.trainingRunsToday,
        });
      }

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
        status: 'queued',
        message: 'Indexing Started',
      });
    },
    {
      body: 'IndexingStartBody',
      response: {
        200: 'IndexingStartResponse',
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
        agentId: query.agentId,
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
        agentId: z.string(),
      }),
      response: 'IndexingStatusResponse',
    },
  );
