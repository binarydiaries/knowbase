import { Elysia } from 'elysia';
import { ErrorModel } from '../../common/models/error';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { DocumentService } from '../document/service';
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
    response: {
      404: 'NotFoundResponse',
    },
  })
  .resolve(async ({ params, status }) => {
    const newParams = params as { id: string };

    const chatbot = await ChatbotService.single({ id: newParams.id });
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
    async ({ chatbot, params }) => {
      const [documents, behaviour, channels] = await Promise.all([
        DocumentService.list({ chatbotId: params.id }),
        BehaviourService.singleByChatbot(params.id),
        ChannelService.list({ chatbotId: params.id }),
      ]);

      return {
        chatbot,
        behaviour: behaviour,
        documents: documents.map(DocumentService.transformDocument),
        channels: channels.map(ChannelService.transformChannel),
      };
    },
    {
      // params: 'OneChatbotParams',
      response: {
        200: 'OneChatbotResponse',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      return {
        chatbot: await ChatbotService.update(params.id, {
          ...body,
        }),
      };
    },
    {
      body: 'UpdateChatbotBody',
      response: {
        200: 'OneSmallChatbotResponse',
      },
    },
  );
