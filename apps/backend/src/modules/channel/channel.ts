import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChatbotService } from '../chatbot/service';
import { SubscriptionService } from '../subscription/service';
import { ChannelModel } from './model';
import { ChannelService } from './service';

export const Channel = new Elysia({
  prefix: '/channels',
  tags: ['Channel'],
})
  .use(AuthGuard)
  .use(ChannelModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, userId, orgId, status }) => {
      const chatbot = await ChatbotService.single({
        id: body.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      const channel = await ChannelService.create({
        ...body,
        type: body.additional.type,
        config: body.additional.config,
        usage: {},
        createdBy: userId,
      });
      return {
        channel: ChannelService.transformChannel(channel),
      };
    },
    {
      body: 'CreateChannelBodySchema',
      response: {
        200: 'OneChannelResponse',
        403: 'ChatbotLockedResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '',
    async ({ query, orgId }) => {
      return {
        channels: (
          await ChannelService.list({ chatbotId: query.chatbotId, orgId })
        ).map(ChannelService.transformChannel),
      };
    },
    {
      query: 'ChannelListQuerySchema',
      response: 'ManyChannelResponse',
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'ChatbotLockedResponse',
    },
  })
  .resolve(async ({ params, status, orgId }) => {
    const newParam = params as { id: string };
    const channel = await ChannelService.single({ id: newParam.id, orgId });

    if (!channel) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Channel not found',
      });
    }
    return { channel };
  })
  .get(
    '/:id',
    async ({ channel }) => {
      return {
        channel: ChannelService.transformChannel(channel),
      };
    },
    {
      response: {
        200: 'OneChannelResponse',
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, channel, orgId, status }) => {
      const chatbot = await ChatbotService.single({
        id: channel.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      const updatedChannel = await ChannelService.update(params.id, {
        ...body,
        type: body?.additional?.type || channel.type,
        config: {
          ...channel.config,
          ...body?.additional?.config,
        },
      });
      return {
        channel: ChannelService.transformChannel(updatedChannel),
      };
    },
    {
      body: 'UpdateChannelBodySchema',
      response: {
        200: 'OneChannelResponse',
        403: 'ChatbotLockedResponse',
      },
    },
  );
