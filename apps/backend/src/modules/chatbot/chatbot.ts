import { Elysia } from 'elysia';
import { ChatbotModel } from './model';
import { ChatbotService } from './service';

export const Chatbot = new Elysia({
  prefix: '/chatbots',
  tags: ['Chatbot'],
})
  .use(ChatbotModel)
  .post(
    '',
    async ({ body }) => {
      const chatbot = await ChatbotService.create({
        ...body,
        status: 'draft',
        createdBy: '123',
        orgId: '123',
      });

      console.log(chatbot);

      return {
        chatbot,
      };
    },
    {
      body: 'CreateChatbotBody',
      response: 'OneChatbotResponse',
    },
  );
