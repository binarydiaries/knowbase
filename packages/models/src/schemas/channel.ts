import { z } from 'zod';

export const ChannelStatusSchema = z.enum(['inactive', 'active', 'error']);

export const ChannelWebConfigSchema = z.object({
  displayName: z.string(),
  subtitle: z.string().optional(),
  welcomeMessage: z.string(),
  suggestionQuestions: z.array(z.string()).max(6).optional(),
  inputPlaceholder: z.string().optional(),
  primaryColor: z.string(),
  allowedDomains: z.array(z.string()),
  avatarUrl: z.string().optional(),
});

export type IChannelWebConfig = z.infer<typeof ChannelWebConfigSchema>;

export const ChannelWhatsAppConfigSchema = z.object({
  phoneNumberId: z.string().optional(),
  displayPhone: z.string().optional(),
});

export type IChannelWhatsAppConfig = z.infer<typeof ChannelWhatsAppConfigSchema>;

export const ChannelSlackConfigSchema = z.object({
  mode: z.enum(['channel', 'mention']).optional(),
  slackChannelId: z.string().optional(),
  slackChannelName: z.string().optional(),
});

export type IChannelSlackConfig = z.infer<typeof ChannelSlackConfigSchema>;

export const ChannelSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  enabled: z.boolean(),
  channelStatus: ChannelStatusSchema,
  additional: z.discriminatedUnion('type', [
    z.object({ type: z.literal('web'), config: ChannelWebConfigSchema }).meta({ title: 'web' }),
    z.object({ type: z.literal('whatsapp'), config: ChannelWhatsAppConfigSchema }).meta({ title: 'whatsapp' }),
    z.object({ type: z.literal('instagram'), config: z.object({}) }).meta({ title: 'instagram' }),
    z.object({ type: z.literal('slack'), config: ChannelSlackConfigSchema }).meta({ title: 'slack' }),
  ]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IChannelSchema = z.infer<typeof ChannelSchema>;
