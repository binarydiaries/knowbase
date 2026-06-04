import { Elysia } from 'elysia';
import { z } from 'zod';

export const WebChatBodySchema = z.object({
  message: z.string().min(1),
  channelId: z.string(),
  conversationId: z.string(),
  parentOrigin: z.string().optional(),
});

export const WhatsAppChatBodySchema = z.object({
  channelId: z.string(),
  orgId: z.string(),
  senderPhone: z.string(),
  message: z.string(),
  messageId: z.string().optional(),
});

export const SlackChatBodySchema = z.object({
  channelId: z.string(),
  orgId: z.string(),
  message: z.string(),
  slackChannelId: z.string(),
  threadTs: z.string(),
});

export const Model = new Elysia().model({
  WebChatBodySchema,
  WhatsAppChatBodySchema,
  SlackChatBodySchema,
});
