import { Elysia } from 'elysia';
import { z } from 'zod';
import { ErrorModel } from '../../common/models/error';
import type { IChannelWebConfig } from '../channel/model';
import { ChannelService } from '../channel/service';
import { Model } from './model';
import { ChatService, DomainNotAllowedError, MessageLimitReachedError, NotFoundError } from './service';

function isDomainAllowed(origin: string | undefined, allowedDomains: string[]): boolean {
  if (!allowedDomains.length) return true;
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return allowedDomains.includes(host);
  } catch {
    return false;
  }
}

export const Chat = new Elysia({ prefix: '/chat', tags: ['Chats'] })
  .use(Model)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, status, headers }) => {
      const { message, channelId, conversationId } = body;
      const ip =
        (headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          ?.trim() ??
        (headers['x-real-ip'] as string | undefined) ??
        undefined;

      try {
        return await ChatService.sendWeb({
          conversationId,
          message: message,
          channelId,
          origin: headers['origin'] as string | undefined,
          ip,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, { code: 'NOT_FOUND', message: error.message });
        }

        if (error instanceof DomainNotAllowedError) {
          return status(403, { code: 'FORBIDDEN', message: error.message });
        }

        if (!(error instanceof MessageLimitReachedError)) {
          throw error;
        }

        return status(403, {
          code: 'MESSAGE_LIMIT_REACHED',
          message: error.message,
          plan: error.payload.plan,
          messagesPerMonthLimit: error.payload.messagesPerMonthLimit,
          messagesThisMonth: error.payload.messagesThisMonth,
        });
      }
    },
    {
      body: 'ChatBodySchema',
      response: {
        200: z.any(),
        403: 'ChatForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .get(
    '/channel',
    async ({ query, status, headers }) => {
      const channel = await ChannelService.singleById(query.channelId);

      if (!channel) {
        return status(404, { code: 'NOT_FOUND', message: 'Channel not found or Invalid' });
      }

      if (channel.type === 'web') {
        const config = channel.config as IChannelWebConfig;
        if (!isDomainAllowed(headers['origin'] as string | undefined, config.allowedDomains ?? [])) {
          return status(403, { code: 'FORBIDDEN', message: 'Domain not allowed' });
        }
      }

      return {
        channel: ChannelService.transformChannel(channel),
      };
    },
    {
      query: 'ChatChannelQueryParamSchema',
      response: {
        200: 'ChatChannelResponseSchema',
        404: 'NotFoundResponse',
      },
    },
  );

