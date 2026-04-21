import { Elysia } from 'elysia';
import { z } from 'zod';

export const ChannelStatusSchema = z.enum(['inactive', 'active', 'error']);

export const ChannelWebConfigSchema = z.object({
  displayName: z.string(),
  subtitle: z.string().optional(),
  welcomeMessage: z.string(),
  inputPlaceholder: z.string().optional(),
  primaryColor: z.string(),
  allowedDomains: z.array(z.string()),
});

export type IChannelWebConfig = z.infer<typeof ChannelWebConfigSchema>;

export const ChannelWhatsAppConfigSchema = z.object({
  phoneNumberId: z.string().optional(),
  displayPhone: z.string().optional(),
});

export type IChannelWhatsAppConfig = z.infer<typeof ChannelWhatsAppConfigSchema>;

const ChannelSchemaType = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('web'),
      config: ChannelWebConfigSchema,
    })
    .meta({ title: 'web' }),
  z
    .object({
      type: z.literal('whatsapp'),
      config: ChannelWhatsAppConfigSchema,
    })
    .meta({ title: 'whatsapp' }),
  z
    .object({
      type: z.literal('instagram'),
      config: z.object({}),
    })
    .meta({ title: 'instagram' }),
]);

export const ChannelSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  enabled: z.boolean(),
  channelStatus: ChannelStatusSchema,
  additional: ChannelSchemaType,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IChannelSchema = z.infer<typeof ChannelSchema>;

const ChannelListQuerySchema = z.object({
  agentId: z.string().optional(),
});

const ManyChannelResponse = z.object({
  channels: z.array(ChannelSchema),
});

const OneChannelResponse = z.object({
  channel: ChannelSchema,
});

const CreateChannelBodySchema = ChannelSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const UpdateChannelBodySchema = CreateChannelBodySchema.partial();

export const ChannelModel = new Elysia().model({
  ChannelSchema,
  ChannelListQuerySchema,
  ManyChannelResponse,
  CreateChannelBodySchema,
  UpdateChannelBodySchema,
  OneChannelResponse,
});
