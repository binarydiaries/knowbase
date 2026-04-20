import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
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
      const action = await ActionService.update(params.id, body);
      return { action };
    },
    {
      body: 'UpdateChatbotActionBody',
      response: {
        200: 'OneChatbotActionResponse',
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
