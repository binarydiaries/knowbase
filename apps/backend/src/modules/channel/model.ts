import { Elysia } from 'elysia';
import { z } from 'zod';
import {
  ChannelSchema,
  ChannelSlackConfigSchema,
  ChannelStatusSchema,
  ChannelWebConfigSchema,
  ChannelWhatsAppConfigSchema,
  type IChannelSchema,
  type IChannelSlackConfig,
  type IChannelWebConfig,
  type IChannelWhatsAppConfig,
} from '@knowbase/models/schemas';

export {
  ChannelSchema,
  ChannelSlackConfigSchema,
  ChannelStatusSchema,
  ChannelWebConfigSchema,
  ChannelWhatsAppConfigSchema,
  type IChannelSchema,
  type IChannelSlackConfig,
  type IChannelWebConfig,
  type IChannelWhatsAppConfig,
};

const ChannelListQuerySchema = z.object({
  agentId: z.string().optional(),
});

const ManyChannelResponse = z.object({ channels: z.array(ChannelSchema) });
const OneChannelResponse = z.object({ channel: ChannelSchema });
const CreateChannelBodySchema = ChannelSchema.omit({ id: true, createdAt: true, updatedAt: true });
const UpdateChannelBodySchema = CreateChannelBodySchema.partial();

export const ChannelModel = new Elysia().model({
  ChannelSchema,
  ChannelListQuerySchema,
  ManyChannelResponse,
  CreateChannelBodySchema,
  UpdateChannelBodySchema,
  OneChannelResponse,
});
