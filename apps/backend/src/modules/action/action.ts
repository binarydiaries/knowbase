import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { SubscriptionService } from '../subscription/service';
import { ChatbotService } from '../chatbot/service';
import { ActionModel } from './model';
import { ActionService } from './service';

export const Action = new Elysia({
  prefix: '/chatbot-actions',
  tags: ['Actions'],
})
  .use(AuthGuard)
  .use(ActionModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ query, orgId }) => {
      const { chatbotId } = query;
      const actions = await ActionService.getByChatbot(chatbotId);
      return { actions };
    },
    {
      query: 'GetChatbotActionsQuery',
      response: {
        200: 'ManyChatbotActionResponse',
      },
    },
  )
  .post(
    '',
    async ({ body, orgId, userId, status }) => {
      if (body.actionType === 'lead_generation') {
        const access = await SubscriptionService.assertLeadGenerationAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message: 'Lead generation is available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const chatbot = await ChatbotService.single({ id: body.chatbotId, orgId });
      if (!chatbot) {
        return status(404, { code: 'NOT_FOUND', message: 'Chatbot not found' });
      }

      const action = await ActionService.create({
        chatbotId: body.chatbotId,
        actionType: body.actionType,
        config: body.config ?? {},
        createdBy: userId,
      });
      return { action };
    },
    {
      body: 'CreateChatbotActionBody',
      response: {
        200: 'OneChatbotActionResponse',
        403: 'LeadGenerationForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
    },
  })
  .patch(
    '/:id',
    async ({ params, body, orgId, status }) => {
      const existing = await ActionService.single({ id: params.id, orgId });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Action not found' });
      }

      // Block free plan from enabling lead generation
      if (existing.actionType === 'lead_generation' && body.enabled === true) {
        const access = await SubscriptionService.assertLeadGenerationAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message: 'Lead generation is available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const action = await ActionService.update(params.id, body);
      return { action };
    },
    {
      body: 'UpdateChatbotActionBody',
      response: {
        200: 'OneChatbotActionResponse',
        403: 'LeadGenerationForbiddenResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, orgId, status }) => {
      const existing = await ActionService.single({ id: params.id, orgId });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Action not found' });
      }
      await ActionService.delete(params.id);
      return { success: true };
    },
    {
      response: {
        200: 'DeleteActionResponse',
      },
    },
  );
