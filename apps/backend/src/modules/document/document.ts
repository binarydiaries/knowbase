import { Elysia } from 'elysia';
import { z } from 'zod';
import { ErrorModel } from '../../common/models/error';
import { DocumentModel } from './model';
import { DocumentServiceV1 } from './service';

export const Document = new Elysia({
  prefix: '/documents',
  tags: ['Document'],
})
  .use(DocumentModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body }) => {
      const document = await DocumentServiceV1.create({
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
      const documents = await DocumentServiceV1.list();
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
    const document = await DocumentServiceV1.single(params.id);

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
        document: await DocumentServiceV1.update(params.id, body.content),
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
      await DocumentServiceV1.delete(params.id);
      return status(204, undefined);
    },
    {
      response: {
        204: z.undefined(),
      },
    },
  );
