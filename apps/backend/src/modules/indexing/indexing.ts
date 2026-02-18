import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { addIndexDocumentJob } from '../../queue/indexing/indexing.queue';
import { DocumentService } from '../document/service';
import { IndexingModel } from './model';

export const Indexing = new Elysia({
  prefix: '/indexing',
  tags: ['Indexing'],
})
  .use(AuthGuard)
  .use(IndexingModel)
  .post(
    '',
    async ({ body, status, orgId }) => {
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
      202: 'IndexingStartResponse',
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
