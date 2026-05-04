import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { Behaviour } from './modules/behaviour/behaviour';
import { WhatsApp } from './modules/whatsapp/whatsapp';
import { Slack } from './modules/slack/slack';
import { Analytics } from './modules/analytics/analytics';
import { UsageCharts } from './modules/usage/usage';
import { Channel } from './modules/channel/channel';
import { Chat } from './modules/chat/chat';
import { Agent } from './modules/agent/agent';
import { Conversation } from './modules/conversation/conversation';
import { Document } from './modules/document/document';
import { Indexing } from './modules/indexing/indexing';
import { message } from './modules/message/message';
import { Subscription } from './modules/subscription/subscription';
import { Action } from './modules/action/action';
import { Lead } from './modules/lead/lead';
import { Admin } from './modules/admin/admin';
import { AdminQueue } from './modules/admin/queue';
import { AdminSubscriptions } from './modules/admin/subscriptions';
import { Voice } from './modules/voice/voice';

const app = new Elysia()
  .use(
    openapi({
      path: '/docs',
      mapJsonSchema: {
        zod: (schema: schemas.$ZodType) =>
          z.toJSONSchema(schema, {
            unrepresentable: 'any',
            target: 'openapi-3.0',
            override: (ctx) => {
              const def = ctx.zodSchema._zod.def;
              if (def.type === 'date') {
                ctx.jsonSchema.type = 'string';
                ctx.jsonSchema.format = 'date-time';
              }
            },
          }),
      },
      documentation: {
        info: {
          title: 'Agenvik Documentation',
          version: '1.0.0',
        },
      },
    }),
  )
  .use(cors())
  .use(UsageCharts)
  .use(Analytics)
  .use(Chat)
  .use(message)
  .use(Document)
  .use(Agent)
  .use(Indexing)
  .use(Conversation)
  .use(Behaviour)
  .use(Channel)
  .use(Subscription)
  .use(WhatsApp)
  .use(Slack)
  .use(Action)
  .use(Lead)
  .use(Admin)
  .use(AdminQueue)
  .use(AdminSubscriptions)
  .use(Voice)
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
