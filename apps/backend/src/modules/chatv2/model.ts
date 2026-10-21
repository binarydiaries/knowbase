import { Elysia } from 'elysia';
import { z } from 'zod';
import { ChannelSchema } from '../channel/model';

const ChatV2BodySchema = z.object({
  conversationId: z.string().min(1).max(128),
  message: z.string().min(1).max(16000),
  channelId: z.string(),
  parentOrigin: z.string().optional(),
});

const ChatV2ChannelQueryParamSchema = z.object({
  channelId: z.string(),
  parentOrigin: z.string().optional(),
});

const ChatV2ChannelResponseSchema = z.object({
  channel: ChannelSchema,
});

export const ModelV2 = new Elysia().model({
  ChatV2BodySchema,
  WebChatBodySchema: ChatV2BodySchema.omit({ conversationId: true }).extend({
    conversationToken: z.string().max(256),
  }),
  WebSessionBodySchema: ChatV2ChannelQueryParamSchema,
  ChatV2ChannelQueryParamSchema,
  ChatV2ChannelResponseSchema,
});
