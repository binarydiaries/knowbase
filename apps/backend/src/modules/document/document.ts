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
      const document = await DocumentService.create({
        ...body,
        contentSerialized: body.content.data,
        type: body.content.type,
        createdBy: '111',
        orgId: '112',
      });
      return {
        document: DocumentService.transformDocument(document),
      };
    },
    {
      body: 'CreateDocumentBody',
      response: 'OneDocumentResponse',
    },
  )
  .get(
    '',
    async ({ query }) => {
      const documents = await DocumentService.list({
        chatbotId: query.chatbotId,
      });
      return {
        documents: documents.map(DocumentService.transformDocument),
      };
    },
    {
      response: 'ManyDocumentsResponse',
      query: 'ChatbotDocumentsParams',
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
        document: DocumentService.transformDocument(document),
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
    async ({ params, body, document }) => {
      const updatedDocument = await DocumentService.update(params.id, {
        ...body,
        contentSerialized: body.content.data,
        type: body.content.type,
        version: document.version + 1,
        status: 'ready',
      });
      return {
        document: DocumentService.transformDocument(updatedDocument),
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
