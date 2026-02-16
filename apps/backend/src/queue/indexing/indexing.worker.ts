import { type Job, Worker } from 'bullmq';
import { connection } from '../connection';
import { indexingQueue } from './indexing.queue';
import type { IIndexDocumentJob } from './indexing.types';

export const indexingWorker = new Worker(
  indexingQueue.name,
  async (job: Job<IIndexDocumentJob>) => {
    const { documentId } = job.data;

    // await DocumentIndexService.index(documentId);
  },
  {
    connection,
    concurrency: 3, // limit embedding parallelism
  },
);

indexingWorker.on('ready', async () => {
  console.log('Ready ');
});

indexingWorker.on('completed', (job) => {
  console.log('completed', job.name, job.queueName);
});

indexingWorker.on('failed', async (job, err) => {
  // const { documentId } = job.data;
  //
  // await db
  //   .update(documents)
  //   .set({ status: 'failed' })
  //   .where(eq(documents.id, documentId));
});
