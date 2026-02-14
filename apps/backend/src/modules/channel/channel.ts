import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
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
    async ({ body, userId }) => {
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
      response: 'OneChannelResponse',
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
    async ({ params, body, channel }) => {
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
      },
    },
  );
