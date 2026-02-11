import { Elysia } from 'elysia';
import { clerkPlugin } from 'elysia-clerk';
import { ClerkModule } from '../../common/clerkModule';
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
  .use(clerkPlugin())
  .resolve(({ auth }) => {
    const { userId, orgId } = auth();

    if (!userId || !orgId) {
      throw new Error('Not authenticated');
    }

    return {
      userId,
      orgId,
      auth,
    };
  })
  .use(ChatbotModel)
  .use(ErrorModel)
  .use(ClerkModule)
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
