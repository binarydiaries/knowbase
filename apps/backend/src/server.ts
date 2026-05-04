import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { Action } from './modules/action/action';
import { Admin } from './modules/admin/admin';
import { AdminQueue } from './modules/admin/queue';
import { AdminSubscriptions } from './modules/admin/subscriptions';
import { Agent } from './modules/agent/agent';
import { Analytics } from './modules/analytics/analytics';
import { Behaviour } from './modules/behaviour/behaviour';
import { Channel } from './modules/channel/channel';
import { Chat } from './modules/chat/chat';
import { Conversation } from './modules/conversation/conversation';
import { Document } from './modules/document/document';
import { Indexing } from './modules/indexing/indexing';
import { Lead } from './modules/lead/lead';
import { message } from './modules/message/message';
import { Slack } from './modules/slack/slack';
import { Subscription } from './modules/subscription/subscription';
import { UsageCharts } from './modules/usage/usage';
import { WhatsApp } from './modules/whatsapp/whatsapp';

Sentry.init({
  dsn: 'https://c9a6f1f3bd7cfafb990c1d3ef07c518d@o4505526005399552.ingest.us.sentry.io/4511332466884609',
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/elysia/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

const app = Sentry.withElysia(new Elysia())
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
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
