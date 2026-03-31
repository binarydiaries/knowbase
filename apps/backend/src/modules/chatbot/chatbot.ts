import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { DocumentService } from '../document/service';
import { ChatbotModel } from './model';
import { ChatbotService } from './service';

export const Chatbot = new Elysia({
  prefix: '/chatbots',
  tags: ['Chatbot'],
})
  .use(AuthGuard)
  .use(ChatbotModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, userId, orgId }) => {
      const chatbot = await ChatbotService.create({
        ...body,
        createdBy: userId,
        orgId,
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
    async ({ orgId }) => {
      const chatbots = await ChatbotService.list({ orgId });
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
  .get(
    '/:id',
    async ({ params, orgId, status }) => {
      const chatbot = await ChatbotService.singleWithRelations({
        id: params.id,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }
      const { behaviour, channels, documents, ...otherChatbot } = chatbot;
      return {
        chatbot: otherChatbot,
        // biome-ignore lint/style/noNonNullAssertion: Will fix later
        behaviour: behaviour!,
        documents: documents.map(DocumentService.transformDocument),
        channels: channels.map(ChannelService.transformChannel),
      };
    },
    {
      response: {
        200: 'OneChatbotResponse',
      },
    },
  )
  .resolve(async ({ params, status, orgId }) => {
    const newParams = params as { id: string };
    const chatbot = await ChatbotService.single({ id: newParams.id, orgId });

    if (!chatbot) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Chatbot not found',
      });
    }
    return { chatbot };
  })
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
