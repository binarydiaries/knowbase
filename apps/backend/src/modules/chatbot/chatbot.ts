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
        settings: {
          displayName: body.name,
          welcomeMessage: 'Hi! How can I help you today?',
          primaryColor: '#000000',
        },
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
      response: 'OneSmallChatbotResponse',
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
  .resolve(async ({ params, status }) => {
    const chatbot = await ChatbotService.single({ id: params.id });
    if (!chatbot) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Chatbot not found',
      });
    }
    return { chatbot };
  })
  .get(
    '/:id',
    async ({ chatbot }) => {
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
    async ({ params, body, chatbot }) => {
      return {
        chatbot: await ChatbotService.update(params.id, {
          ...body,
          settings: {
            ...chatbot.settings,
            ...body.settings,
          },
        }),
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
      await ChatbotService.delete(params.id);
      return status(204, undefined);
    },
    {
      response: {
        204: 'DeleteChatbotResponse',
      },
    },
  );
