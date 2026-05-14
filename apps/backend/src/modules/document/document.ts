import { Elysia } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { AgentService } from '../agent/service';
import { SubscriptionService } from '../subscription/service';
import { DocumentModel, DocumentPdfModel, DocumentUrlModel } from './model';
import { pdfToMarkdown } from './pdfUtils';
import { DocumentService } from './service';
import { urlToText } from './urlUtils';

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
      const agent = await AgentService.single({
        id: body.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
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
        agentId: query.agentId,
        orgId,
      });
      return {
        documents: documents.map(DocumentService.transformDocument),
      };
    },
    {
      response: 'ManyDocumentsResponse',
      query: 'AgentDocumentsParams',
    },
  )
  .use(DocumentPdfModel)
  .use(DocumentUrlModel)
  .post(
    '/pdf/preview',
    async ({ body, orgId, status }) => {
      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      if (!body.file.type.includes('pdf')) {
        return status(422, {
          code: 'INVALID_FILE',
          message: 'Only PDF files are supported.',
        });
      }

      let result: Awaited<ReturnType<typeof pdfToMarkdown>>;
      try {
        result = await pdfToMarkdown(new Uint8Array(await body.file.arrayBuffer()));
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        if (msg.includes('password')) {
          return status(422, {
            code: 'PDF_ENCRYPTED',
            message: 'Password-protected PDFs are not supported.',
          });
        }
        throw err;
      }

      if (!result.markdown.trim()) {
        return status(422, {
          code: 'PDF_EMPTY',
          message: 'No text found in this PDF. Image-only PDFs are not supported.',
        });
      }

      return {
        markdown: result.markdown,
        pages: result.pages,
        characters: result.characters,
        truncated: result.truncated,
      };
    },
    {
      body: 'UploadPdfBody',
      response: {
        200: 'PdfPreviewResponse',
        404: 'NotFoundResponse',
        422: 'PdfUploadErrorResponse',
      },
    },
  )
  .post(
    '/pdf',
    async ({ body, userId, orgId, status }) => {
      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      if (SubscriptionService.hasReachedKnowledgeSourceLimit(subscription)) {
        return status(403, {
          code: 'KNOWLEDGE_SOURCE_LIMIT_REACHED',
          message: SubscriptionService.getKnowledgeSourceLimitReachedMessage(subscription),
          plan: subscription.plan,
          knowledgeSourceLimit: subscription.knowledgeSourceLimit,
          knowledgeSourceCount: subscription.knowledgeSourceCount,
        });
      }

      const document = await DocumentService.create({
        agentId: body.agentId,
        title: body.title,
        contentSerialized: body.text,
        type: 'pdf',
        createdBy: userId,
      });

      return { document: DocumentService.transformDocument(document) };
    },
    {
      body: 'SavePdfBody',
      response: {
        200: 'OneDocumentResponse',
        403: 'DocumentWriteForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .post(
    '/url/preview',
    async ({ body, orgId, status }) => {
      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      let result: Awaited<ReturnType<typeof urlToText>>;
      try {
        result = await urlToText(body.url);
      } catch (err) {
        const code = (err as { code?: string }).code ?? 'FETCH_FAILED';
        const messages: Record<string, string> = {
          INVALID_URL: 'Please enter a valid public URL (starting with https://).',
          PRIVATE_HOST: 'Only public URLs are supported.',
          DNS_FAILED: 'Could not resolve this domain. Please check the URL.',
          FETCH_TIMEOUT: 'The page took too long to load. Try a different URL.',
          FETCH_FAILED: 'Could not fetch this page. The site may be blocking bots.',
          NOT_HTML: 'This URL does not return a web page.',
        };
        return status(422, {
          code: code as 'INVALID_URL' | 'FETCH_FAILED' | 'FETCH_TIMEOUT' | 'NOT_HTML' | 'PRIVATE_HOST' | 'DNS_FAILED' | 'PAGE_EMPTY',
          message: messages[code] ?? 'Could not fetch this page.',
        });
      }

      if (result.charCount < 50) {
        return status(422, {
          code: 'PAGE_EMPTY' as const,
          message: 'Very little text was found on this page. Try a different URL.',
        });
      }

      return {
        title: result.title,
        charCount: result.charCount,
        preview: result.text.slice(0, 500),
        rawText: result.text,
      };
    },
    {
      body: 'UrlPreviewBody',
      response: {
        200: 'UrlPreviewResponse',
        404: 'NotFoundResponse',
        422: 'UrlErrorResponse',
      },
    },
  )
  .post(
    '/url',
    async ({ body, userId, orgId, status }) => {
      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      if (SubscriptionService.hasReachedKnowledgeSourceLimit(subscription)) {
        return status(403, {
          code: 'KNOWLEDGE_SOURCE_LIMIT_REACHED',
          message: SubscriptionService.getKnowledgeSourceLimitReachedMessage(subscription),
          plan: subscription.plan,
          knowledgeSourceLimit: subscription.knowledgeSourceLimit,
          knowledgeSourceCount: subscription.knowledgeSourceCount,
        });
      }

      const document = await DocumentService.create({
        agentId: body.agentId,
        title: body.title,
        contentSerialized: { url: body.url, rawText: body.rawText, crawledAt: new Date().toISOString() },
        type: 'url',
        createdBy: userId,
      });
      return { document: DocumentService.transformDocument(document) };
    },
    {
      body: 'SaveUrlBody',
      response: {
        200: 'OneDocumentResponse',
        403: 'DocumentWriteForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'AgentLockedResponse',
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
      const agent = await AgentService.single({
        id: document.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
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
        403: 'AgentLockedResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, status, document, orgId }) => {
      const agent = await AgentService.single({
        id: document.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      await DocumentService.delete(params.id);
      return status(204, undefined);
    },
    {
      response: {
        204: z.undefined(),
        403: 'AgentLockedResponse',
      },
    },
  );
