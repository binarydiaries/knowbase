import { Elysia } from 'elysia';
import { ChannelModel } from './model';
import { ChannelService } from './service';

export const Channel = new Elysia({
  prefix: '/channels',
  tags: ['Channel'],
})
  .use(ChannelModel)
  .get(
    '',
    async ({ query }) => {
      return {
        channels: await ChannelService.list(query),
      };
    },
    {
      query: 'ChannelListQuerySchema',
      response: 'ManyChannelResponse',
    },
  );
