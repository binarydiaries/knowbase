import { type Job, Queue } from 'bullmq';
import { DocumentService } from '../../modules/document/service';
import { connection } from '../connection';
import type { IIndexDocumentJob } from './indexing.types';

export const indexingQueue = new Queue('document-indexing', {
  connection,
});

indexingQueue.on('waiting', async (job: Job<IIndexDocumentJob>) => {
  await DocumentService.update(job.data.documentId, {
    status: 'queue',
  });
});

export const addIndexDocumentJob = (data: IIndexDocumentJob) =>
  indexingQueue.add('index-document', data);
