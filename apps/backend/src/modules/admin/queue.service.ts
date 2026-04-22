import { indexingQueue } from '../../queue/indexing/indexing.queue';
import { DocumentService } from '../document/service';
import { IndexingService } from '../indexing/service';

type JobStatus = 'waiting' | 'active' | 'delayed' | 'failed' | 'completed';

const ALL_STATUSES: JobStatus[] = ['waiting', 'active', 'delayed', 'failed', 'completed'];

export abstract class AdminQueueService {
  static async listJobs({
    status,
    page = 1,
    limit = 50,
  }: {
    status?: JobStatus;
    page?: number;
    limit?: number;
  }) {
    const types = status ? [status] : ALL_STATUSES;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const jobs = await indexingQueue.getJobs(types, start, end, false);

    return Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        // BullMQ jobs in Redis may have legacy data shapes; normalise before returning.
        const raw = job.data as unknown as Record<string, unknown>;
        return {
          id: job.id ?? '',
          name: job.name,
          data: {
            documentId: String(raw.documentId ?? raw.document ?? ''),
            orgId: String(raw.orgId ?? ''),
            version: raw.version != null ? Number(raw.version) : null,
          },
          state,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          processedOn: job.processedOn ?? null,
          finishedOn: job.finishedOn ?? null,
          failedReason: job.failedReason ?? null,
        };
      }),
    );
  }

  static async retryJob(jobId: string) {
    const job = await indexingQueue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const state = await job.getState();

    if (state === 'failed') {
      await job.retry('failed');
      return { action: 'retried', state };
    }

    if (state === 'delayed') {
      await job.promote();
      return { action: 'promoted', state };
    }

    return { action: 'none', state };
  }

  static async executeJob(jobId: string) {
    const job = await indexingQueue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const raw = job.data as unknown as Record<string, unknown>;
    const documentId = String(raw.documentId ?? raw.document ?? '');
    const orgId = String(raw.orgId ?? '');
    const version = raw.version != null ? Number(raw.version) : null;

    if (!documentId || !orgId) throw new Error(`Job ${jobId} has no documentId/orgId`);

    const document = await DocumentService.single({ id: documentId, orgId });
    if (!document) throw new Error(`Document ${documentId} not found`);

    // Remove from queue first so the worker doesn't also pick it up.
    await job.remove();

    await DocumentService.update(documentId, { status: 'indexing' });

    // Run directly in background — do not await so the HTTP response returns immediately.
    IndexingService.embedDocument(document)
      .then(() =>
        DocumentService.update(documentId, {
          status: 'indexed',
          lastIndexedVersion: version ?? document.version,
          lastTrainedAt: new Date(),
        }),
      )
      .catch(() => DocumentService.update(documentId, { status: 'failed' }));

    return { action: 'executing', documentId };
  }

  static async getQueueCounts() {
    const counts = await indexingQueue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'failed',
      'completed',
    );
    return counts;
  }
}
