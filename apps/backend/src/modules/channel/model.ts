import { Elysia } from 'elysia';
import { z } from 'zod';

export const ChannelStatusSchema = z.enum(['inactive', 'active', 'error']);

export const ChannelWebConfigSchema = z.object({
  displayName: z.string(),
  subtitle: z.string().optional(),
  welcomeMessage: z.string(),
  inputPlaceholder: z.string().optional(),
  primaryColor: z.string(),
});
export const ChannelWebUsageSchema = z.object({
  allowedDomains: z.array(z.string()),
});

export const ChannelSchemaBase = z.object({
  id: z.string(),
  chatbotId: z.string(),
  enabled: z.boolean(),
  status: ChannelStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ChannelSchema = z.discriminatedUnion('type', [
  ChannelSchemaBase.extend({
    type: z.literal('web'),
    config: ChannelWebConfigSchema,
    usage: ChannelWebUsageSchema,
  }).meta({ title: 'web' }),
  ChannelSchemaBase.extend({
    type: z.literal('whatsapp'),
    config: z.object({}),
    usage: z.object({}),
  }).meta({ title: 'whatsapp' }),
  ChannelSchemaBase.extend({
    type: z.literal('instagram'),
    config: z.object({}),
    usage: z.object({}),
  }).meta({ title: 'instagram' }),
]);

export type IChannelSchema = z.infer<typeof ChannelSchema>;

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
