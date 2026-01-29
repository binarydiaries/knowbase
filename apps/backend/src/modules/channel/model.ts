import { Elysia } from 'elysia';
import { z } from 'zod';

export const ChannelStatusSchema = z.enum(['inactive', 'active', 'error']);
export const ChannelTypeSchema = z.enum(['web', 'whatsapp', 'instagram']);

export const ChannelConfigSchema = z.object({
  displayName: z.string(),
  subtitle: z.string().optional(),
  welcomeMessage: z.string(),
  inputPlaceholder: z.string().optional(),
  primaryColor: z.string(),
});
export const ChannelUsageSchema = z.unknown();

export const ChannelSchema = z.object({
  id: z.string(),
  chatbotId: z.string(),
  type: ChannelTypeSchema,
  enabled: z.boolean(),
  status: ChannelStatusSchema,
  config: ChannelConfigSchema,
  usage: ChannelUsageSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ChannelListQuerySchema = z.object({
  chatbotId: z.string(),
});

const ManyChannelResponse = z.object({
  channels: z.array(ChannelSchema),
});

export const ChannelModel = new Elysia().model({
  ChannelSchema,
  ChannelListQuerySchema,
  ManyChannelResponse,
});
