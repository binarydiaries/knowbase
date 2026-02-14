import { Elysia } from 'elysia';
import { z } from 'zod';
import { ChannelSchema } from '../channel/model';

const ChatBodySchema = z.object({
  conversationId: z.string(),
  message: z.string(),
  channelId: z.string(),
  orgId: z.string(),
});

const ChatChannelQueryParamSchema = z.object({
  channelId: z.string(),
  orgId: z.string(),
});

const ChatChannelResponseSchema = z.object({
  channel: ChannelSchema,
});

export const Model = new Elysia().model({
  ChatBodySchema,
  ChatChannelQueryParamSchema,
  ChatChannelResponseSchema,
});
