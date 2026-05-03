import { type Job, Worker } from 'bullmq';
import { DocumentService } from '../../modules/document/service';
import { IndexingService } from '../../modules/indexing/service';
import { connection } from '../connection';
import { addEmailJob } from '../email/email.queue';
import { indexingQueue } from './indexing.queue';
import type { IIndexDocumentJob } from './indexing.types';

export const indexingWorker = new Worker(
  indexingQueue.name,
  async (job: Job<IIndexDocumentJob>) => {
    const { documentId, orgId } = job.data;
    await DocumentService.update(job.data.documentId, {
      status: 'indexing',
    });

    const document = await DocumentService.single({ id: documentId, orgId });

    if (!document) {
      throw new Error('Document not found');
    }

    await IndexingService.embedDocument(document, orgId);
  },
  {
    connection,
    concurrency: 3, // limit embedding parallelism
  },
);

indexingWorker.on('completed', async (job) => {
  const { documentId, version, userId, documentTitle } = job.data;
  await DocumentService.update(documentId, {
    status: 'indexed',
    lastIndexedVersion: version,
    lastTrainedAt: new Date(),
  });
  if (userId) {
    await addEmailJob({ type: 'document-indexed', documentId, userId, documentTitle }).catch(() => {});
  }
});

indexingWorker.on('failed', async (job) => {
  if (job?.data) {
    const { documentId, userId, documentTitle } = job.data;
    await DocumentService.update(documentId, { status: 'failed' });
    if (userId) {
      await addEmailJob({ type: 'document-failed', documentId, userId, documentTitle }).catch(() => {});
    }
  }
});
