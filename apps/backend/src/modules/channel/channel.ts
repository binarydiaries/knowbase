import { Elysia } from 'elysia';
import { ErrorModel } from '../../common/models/error';
import { ChannelModel } from './model';
import { ChannelService } from './service';

export const Channel = new Elysia({
  prefix: '/channels',
  tags: ['Channel'],
})
  .use(ChannelModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body }) => {
      const channel = await ChannelService.create({
        ...body,
        type: body.additional.type,
        config: body.additional.config,
        usage: {},
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
    async ({ query }) => {
      return {
        channels: (await ChannelService.list(query)).map(
          ChannelService.transformChannel,
        ),
      };
    },
    {
      query: 'ChannelListQuerySchema',
      response: 'ManyChannelResponse',
    },
  )
  .guard({
    params: 'OneChannelParamsSchema',
    response: {
      404: 'NotFoundResponse',
    },
  })
  .resolve(async ({ params, status }) => {
    const channel = await ChannelService.single(params.id);

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
