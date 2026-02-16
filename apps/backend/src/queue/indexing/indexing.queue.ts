import { type Job, Queue } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { documents } from '../../db/schema/documents';
import { connection } from '../connection';
import type { IIndexDocumentJob } from './indexing.types';

export const indexingQueue = new Queue('document-indexing', {
  connection,
});

indexingQueue.on('waiting', async (job: Job<IIndexDocumentJob>) => {
  await db
    .update(documents)
    .set({
      status: 'queue',
    })
    .where(
      and(
        eq(documents.id, job.data.documentId),
        eq(documents.version, job.data.version),
      ),
    );
});

export const addIndexDocumentJob = (data: IIndexDocumentJob) =>
  indexingQueue.add('index-document', data);
