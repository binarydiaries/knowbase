import { Elysia } from 'elysia';
import { z } from 'zod';
import { DocumentSchema } from '../document/model';

const IndexingStartBody = z.object({
  agentId: z.string(),
});

const IndexingStartResponse = z.object({
  status: z.enum(['queued', 'no_documents_ready']),
  message: z.string(),
});

const IndexingStatusResponse = z.object({
  documentIds: z.array(
    DocumentSchema.pick({
      id: true,
      status: true,
      updatedAt: true,
    }),
  ),
  isPollingActive: z.boolean(),
});

export const IndexingModel = new Elysia().model({
  IndexingStartBody,
  IndexingStartResponse,
  IndexingStatusResponse,
});
