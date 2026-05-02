import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { AgentService } from '../agent/service';
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
      const agent = await AgentService.single({
        id: body.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      if (body.additional.type !== 'web') {
        const channelAccess =
          await SubscriptionService.assertPaidChannelAccess(orgId);
        if (!channelAccess.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message: SubscriptionService.getPaidChannelMessage(
              channelAccess.plan,
            ),
          });
        }
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
        403: 'ChannelWriteForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '',
    async ({ query, orgId }) => {
      return {
        channels: (
          await ChannelService.list({ agentId: query.agentId, orgId })
        ).map(ChannelService.transformChannel),
      };
    },
    {
      query: z.object({
        agentId: z.string().optional(),
      }),
      response: 'ManyChannelResponse',
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'ChannelWriteForbiddenResponse',
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
      const agent = await AgentService.single({
        id: channel.agentId,
        orgId,
      });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      const effectiveType = body?.additional?.type ?? channel.type;
      if (effectiveType !== 'web') {
        const channelAccess =
          await SubscriptionService.assertPaidChannelAccess(orgId);
        if (!channelAccess.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message: SubscriptionService.getPaidChannelMessage(
              channelAccess.plan,
            ),
          });
        }
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
        403: 'ChannelWriteForbiddenResponse',
      },
    },
  );
