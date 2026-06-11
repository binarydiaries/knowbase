import { Elysia } from 'elysia';
import { z } from 'zod';
import { ChannelSchema } from '../channel/model';

const ChatV2BodySchema = z.object({
  conversationId: z.string(),
  message: z.string(),
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
  ChatV2ChannelQueryParamSchema,
  ChatV2ChannelResponseSchema,
});
