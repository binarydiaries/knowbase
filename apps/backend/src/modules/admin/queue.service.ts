import { connection } from '../../queue/connection';
import { indexingQueue } from '../../queue/indexing/indexing.queue';
import { DocumentService } from '../document/service';
import { IndexingService } from '../indexing/service';

type JobStatus = 'waiting' | 'active' | 'delayed' | 'failed' | 'completed';

const ALL_STATUSES: JobStatus[] = [
  'waiting',
  'active',
  'delayed',
  'failed',
  'completed',
];

// BullMQ default prefix + queue name
const queueBase = `bull:${indexingQueue.name}`;

function normalizeData(raw: unknown) {
  const r = raw as Record<string, unknown>;
  return {
    documentId: String(r.documentId ?? r.document ?? ''),
    orgId: String(r.orgId ?? ''),
    version: r.version != null ? Number(r.version) : null,
  };
}

export abstract class AdminQueueService {
  static async listJobs({
    status,
    page = 1,
    limit = 25,
  }: {
    status?: JobStatus;
    page?: number;
    limit?: number;
  }) {
    const types = status ? [status] : ALL_STATUSES;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const jobs = await indexingQueue.getJobs(types, start, end, false);

    const normalized = await Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        return {
          id: job.id ?? '',
          name: job.name,
          data: normalizeData(job.data),
          state,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          processedOn: job.processedOn ?? null,
          finishedOn: job.finishedOn ?? null,
          failedReason: job.failedReason ?? null,
        };
      }),
    );

    // Sort newest-first regardless of state
    normalized.sort((a, b) => b.timestamp - a.timestamp);

    const counts = await indexingQueue.getJobCounts(
      ...(ALL_STATUSES as [JobStatus, ...JobStatus[]]),
    );
    const total = status
      ? (counts[status] ?? 0)
      : Object.values(counts).reduce((s, n) => s + n, 0);

    return { jobs: normalized, total, page, limit };
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

    const { documentId, orgId, version } = normalizeData(job.data);
    if (!documentId || !orgId)
      throw new Error(`Job ${jobId} has no documentId/orgId`);

    const document = await DocumentService.single({ id: documentId, orgId });
    if (!document) throw new Error(`Document ${documentId} not found`);

    const state = await job.getState();
    if (state === 'active') throw new Error(`Job ${jobId} is already active`);

    await DocumentService.update(documentId, { status: 'indexing' });

    // Run directly in background — do not await so the HTTP response returns immediately.
    IndexingService.embedDocument(document, orgId)
      .then(async () => {
        await DocumentService.update(documentId, {
          status: 'indexed',
          lastIndexedVersion: version ?? document.version,
          lastTrainedAt: new Date(),
        });
        // Move the BullMQ job to completed so it stays visible and auditable.
        await AdminQueueService.moveToCompleted(jobId, state);
      })
      .catch(async () => {
        await DocumentService.update(documentId, { status: 'failed' });
      });

    return { action: 'executing', documentId };
  }

  // Moves a job to the BullMQ completed sorted set by directly updating Redis,
  // which is necessary because BullMQ only allows completion from inside a worker.
  private static async moveToCompleted(jobId: string, currentState: string) {
    const now = Date.now();
    const pipeline = connection.pipeline();

    // Remove from whatever bucket it's currently in
    if (currentState === 'waiting') {
      pipeline.lrem(`${queueBase}:wait`, 0, jobId);
    } else if (currentState === 'failed') {
      pipeline.zrem(`${queueBase}:failed`, jobId);
    } else if (currentState === 'delayed') {
      pipeline.zrem(`${queueBase}:delayed`, jobId);
    }

    // Add to completed sorted set (score = finishedOn ms)
    pipeline.zadd(`${queueBase}:completed`, now, jobId);

    // Stamp the job hash with completion timestamps
    pipeline.hset(
      `${queueBase}:${jobId}`,
      'processedOn',
      now,
      'finishedOn',
      now,
      'returnvalue',
      'null',
    );

    await pipeline.exec();
  }

  static async getQueueCounts() {
    const counts = await indexingQueue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'failed',
      'completed',
    );
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      delayed: counts.delayed ?? 0,
      failed: counts.failed ?? 0,
      completed: counts.completed ?? 0,
    };
  }
}
