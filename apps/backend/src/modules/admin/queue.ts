import { Elysia } from 'elysia';
import { z } from 'zod';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { AdminQueueService } from './queue.service';

const QueueJobStatusSchema = z.enum(['waiting', 'active', 'delayed', 'failed', 'completed']);

const QueueJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.record(z.unknown()),
  state: z.string(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().nullable(),
  finishedOn: z.number().nullable(),
  failedReason: z.string().nullable(),
});

const QueueListQuerySchema = z.object({
  status: QueueJobStatusSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
});

const QueueCountsSchema = z.object({
  waiting: z.number(),
  active: z.number(),
  delayed: z.number(),
  failed: z.number(),
  completed: z.number(),
});

const QueueActionResponseSchema = z.object({
  action: z.string(),
  state: z.string().optional(),
  documentId: z.string().optional(),
});

const QueueModel = new Elysia().model({
  QueueListQuerySchema,
  QueueListResponseSchema: z.array(QueueJobSchema),
  QueueCountsResponseSchema: QueueCountsSchema,
  QueueActionResponseSchema,
});

export const AdminQueue = new Elysia({
  prefix: '/admin/queue',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .use(QueueModel)
  .get(
    '/counts',
    async () => AdminQueueService.getQueueCounts(),
    {
      response: 'QueueCountsResponseSchema',
    },
  )
  .get(
    '/jobs',
    async ({ query }) =>
      AdminQueueService.listJobs({
        status: query.status,
        page: query.page,
        limit: query.limit,
      }),
    {
      query: 'QueueListQuerySchema',
      response: 'QueueListResponseSchema',
    },
  )
  .post(
    '/jobs/:jobId/retry',
    async ({ params, error }) => {
      try {
        return await AdminQueueService.retryJob(params.jobId);
      } catch (err) {
        throw error(404, { code: 'NOT_FOUND', message: (err as Error).message });
      }
    },
    {
      response: 'QueueActionResponseSchema',
    },
  )
  .post(
    '/jobs/:jobId/execute',
    async ({ params, error }) => {
      try {
        return await AdminQueueService.executeJob(params.jobId);
      } catch (err) {
        throw error(404, { code: 'NOT_FOUND', message: (err as Error).message });
      }
    },
    {
      response: 'QueueActionResponseSchema',
    },
  );
