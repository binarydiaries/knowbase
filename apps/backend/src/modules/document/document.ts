import { Elysia } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChatbotService } from '../chatbot/service';
import { SubscriptionService } from '../subscription/service';
import { DocumentModel } from './model';
import { DocumentService } from './service';

export const Document = new Elysia({
  prefix: '/documents',
  tags: ['Document'],
})
  .onError(({ error }) => console.log(error))
  .use(AuthGuard)
  .use(DocumentModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, userId, orgId, status }) => {
      const chatbot = await ChatbotService.single({
        id: body.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      if (SubscriptionService.hasReachedKnowledgeSourceLimit(subscription)) {
        return status(403, {
          code: 'KNOWLEDGE_SOURCE_LIMIT_REACHED',
          message:
            SubscriptionService.getKnowledgeSourceLimitReachedMessage(
              subscription,
            ),
          plan: subscription.plan,
          knowledgeSourceLimit: subscription.knowledgeSourceLimit,
          knowledgeSourceCount: subscription.knowledgeSourceCount,
        });
      }

      const document = await DocumentService.create({
        ...body,
        contentSerialized: body.content.data,
        type: body.content.type,
        createdBy: userId,
      });
      return {
        document: DocumentService.transformDocument(document),
      };
    },
    {
      body: 'CreateDocumentBody',
      response: {
        200: 'OneDocumentResponse',
        403: 'DocumentWriteForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '',
    async ({ query, orgId }) => {
      const documents = await DocumentService.list({
        chatbotId: query.chatbotId,
        orgId,
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
    response: {
      404: 'NotFoundResponse',
      403: 'ChatbotLockedResponse',
    },
  })
  .resolve(async ({ params, status, orgId }) => {
    const newParams = params as { id: string };
    const document = await DocumentService.single({ id: newParams.id, orgId });

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
    async ({ params, body, document, orgId, status }) => {
      const chatbot = await ChatbotService.single({
        id: document.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

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
        403: 'ChatbotLockedResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, status, document, orgId }) => {
      const chatbot = await ChatbotService.single({
        id: document.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      await DocumentService.delete(params.id);
      return status(204, undefined);
    },
    {
      response: {
        204: z.undefined(),
        403: 'ChatbotLockedResponse',
      },
    },
  );
