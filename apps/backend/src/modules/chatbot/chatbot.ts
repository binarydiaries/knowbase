import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { DocumentService } from '../document/service';
import { SubscriptionService } from '../subscription/service';
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
    async ({ body, userId, orgId, status }) => {
      const chatbotLimit = await SubscriptionService.assertChatbotLimitNotReached(
        orgId,
      );

      if (!chatbotLimit.allowed) {
        return status(403, {
          code: 'CHATBOT_LIMIT_REACHED',
          message: SubscriptionService.getLimitReachedMessage(chatbotLimit),
          plan: chatbotLimit.plan,
          activeChatbotLimit: chatbotLimit.activeChatbotLimit,
          activeChatbotCount: chatbotLimit.activeChatbotCount,
        });
      }

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
      response: {
        200: 'OneSmallChatbotResponse',
        403: 'ChatbotRestrictedResponse',
      },
    },
  )
  .get(
    '',
    async ({ orgId }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
      const chatbots = await ChatbotService.list({ orgId });
      return {
        chatbots: chatbots.map((chatbot) => ({
          ...chatbot,
          locked: SubscriptionService.isChatbotLocked({
            chatbotStatus: chatbot.chatbotStatus,
            subscriptionStatus: subscription,
          }),
        })),
        subscription,
      };
    },
    {
      response: 'ManyChatbotResponse',
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'ChatbotLockedResponse',
    },
  })
  .get(
    '/:id',
    async ({ params, orgId, status }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
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
        chatbot: {
          ...otherChatbot,
          locked: SubscriptionService.isChatbotLocked({
            chatbotStatus: chatbot.chatbotStatus,
            subscriptionStatus: subscription,
          }),
        },
        // biome-ignore lint/style/noNonNullAssertion: Will fix later
        behaviour: behaviour!,
        documents: documents.map(DocumentService.transformDocument),
        channels: channels.map(ChannelService.transformChannel),
        subscription,
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
    async ({ params, body, chatbot, orgId, status }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
      const changedKeys = Object.entries(body).filter(
        ([, value]) => value !== undefined,
      );
      const isArchiveOnly =
        chatbot.chatbotStatus === 'active' &&
        body.chatbotStatus === 'archived' &&
        changedKeys.length === 1 &&
        changedKeys[0]?.[0] === 'chatbotStatus';
      const isUnarchive =
        chatbot.chatbotStatus === 'archived' && body.chatbotStatus === 'active';

      if (subscription.isOverLimit && !isArchiveOnly) {
        if (isUnarchive || SubscriptionService.hasReachedChatbotLimit(subscription)) {
          return status(403, {
            code: 'CHATBOT_LIMIT_REACHED',
            message: SubscriptionService.getLimitReachedMessage(subscription),
            plan: subscription.plan,
            activeChatbotLimit: subscription.activeChatbotLimit,
            activeChatbotCount: subscription.activeChatbotCount,
          });
        }

        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      if (isUnarchive && SubscriptionService.hasReachedChatbotLimit(subscription)) {
        return status(403, {
          code: 'CHATBOT_LIMIT_REACHED',
          message: SubscriptionService.getLimitReachedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

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
        403: 'ChatbotRestrictedResponse',
      },
    },
  );
