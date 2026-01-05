import { Elysia } from 'elysia';
import { ErrorModel } from '../../common/models/error';
import { ChatbotModel } from './model';
import { ChatbotService } from './service';

export const Chatbot = new Elysia({
  prefix: '/chatbots',
  tags: ['Chatbot'],
})
  .use(ChatbotModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body }) => {
      const chatbot = await ChatbotService.create({
        ...body,
        status: 'draft',
        createdBy: '123',
        orgId: '123',
      });
      return {
        chatbot,
      };
    },
    {
      body: 'CreateChatbotBody',
      response: 'OneChatbotResponse',
    },
  )
  .get(
    '',
    async () => {
      const chatbots = await ChatbotService.list();
      return {
        chatbots,
      };
    },
    {
      response: 'ManyChatbotResponse',
    },
  )
  .guard({
    params: 'OneChatbotParams',
    response: {
      404: 'NotFoundResponse',
    },
  })
  .get(
    '/:id',
    async ({ params, status }) => {
      const chatbot = await ChatbotService.single({ id: params.id });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      return {
        chatbot,
      };
    },
    {
      response: {
        200: 'OneChatbotResponse',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, status }) => {
      const team = await ChatbotService.single({ id: params.id });
      if (!team) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }
      return {
        chatbot: await ChatbotService.update(params.id, body),
      };
    },
    {
      body: 'UpdateChatbotBody',
      response: {
        200: 'OneChatbotResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, status }) => {
      const team = await ChatbotService.single({ id: params.id });
      if (!team) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }
      await ChatbotService.delete(params.id);
      return status(204, {});
    },
    {
      response: {
        204: 'DeleteChatbotResponse',
      },
    },
  );
