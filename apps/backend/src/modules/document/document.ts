import { Elysia } from 'elysia';
import { z } from 'zod';
import { ErrorModel } from '../../common/models/error';
import { DocumentModel } from './model';
import { DocumentService } from './service';

export const Document = new Elysia({
  prefix: '/documents',
  tags: ['Document'],
})
  .use(DocumentModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body }) => {
      const document = await DocumentService.createV1({
        ...body,
        createdBy: '111',
        orgId: '112',
      });
      return {
        document,
      };
    },
    {
      body: 'CreateDocumentBody',
      response: 'OneDocumentResponse',
    },
  )
  .get(
    '',
    async () => {
      const documents = await DocumentService.list();
      return {
        documents,
      };
    },
    {
      response: 'ManyDocumentsResponse',
    },
  )
  .guard({
    params: 'OneDocumentParams',
    response: {
      404: 'NotFoundResponse',
    },
  })
  .resolve(async ({ params, status }) => {
    const document = await DocumentService.single(params.id);

    if (!document) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }
    return { document };
  })
  .get(
    '/:id',
    async ({ document }) => {
      return {
        document,
      };
    },
    {
      response: {
        200: 'OneDocumentResponse',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      return {
        document: await DocumentService.update(params.id, body.content),
      };
    },
    {
      body: 'UpdateDocumentBody',
      response: {
        200: 'OneDocumentResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, status }) => {
      await DocumentService.delete(params.id);
      return status(204, undefined);
    },
    {
      response: {
        204: z.undefined(),
      },
    },
  );
