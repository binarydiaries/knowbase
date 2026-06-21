import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
import { helmet } from 'elysia-helmet';
import { rateLimit } from 'elysia-rate-limit';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { Admin } from './modules/admin/admin';
import { AdminDemoBookings } from './modules/admin/demoBookings';
import { AdminFeatureFlags } from './modules/admin/featureFlags';
import { AdminOrgsOverview } from './modules/admin/orgsOverview';
import { AdminQueue } from './modules/admin/queue';
import { AdminSubscriptions } from './modules/admin/subscriptions';
import { Agent } from './modules/agent/agent';
import { Analytics } from './modules/analytics/analytics';
import { Behaviour } from './modules/behaviour/behaviour';
import { Channel } from './modules/channel/channel';
import { ChatV2 } from './modules/chatv2/chatv2';
import { Conversation } from './modules/conversation/conversation';
import { Demo } from './modules/demo/demo';
import { Document } from './modules/document/document';
import { FeatureFlag } from './modules/featureFlag/featureFlag';
import { Indexing } from './modules/indexing/indexing';
import { Intent } from './modules/intent/intent';
import { Lead } from './modules/lead/lead';
import { message } from './modules/message/message';
import { Slack } from './modules/slack/slack';
import { Subscription } from './modules/subscription/subscription';
import { UsageCharts } from './modules/usage/usage';
import { WhatsApp } from './modules/whatsapp/whatsapp';
import { validateEnv } from './utils/env.utils';

validateEnv();

if (process.env.ENV_KEY === 'prod') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV_KEY,
    sendDefaultPii: false,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    ],
    tracesSampleRate: 0.2,
  });
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const app = Sentry.withElysia(new Elysia())
  .use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  )
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'baggage',
        'sentry-trace',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  .use(
    rateLimit({
      duration: 60_000,
      max: 120,
    }),
  )
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
  .use(UsageCharts)
  .use(Analytics)
  .use(ChatV2)
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
  .use(Intent)
  .use(Demo)
  .use(Lead)
  .use(FeatureFlag)
  .use(Admin)
  .use(AdminFeatureFlags)
  .use(AdminQueue)
  .use(AdminSubscriptions)
  .use(AdminDemoBookings)
  .use(AdminOrgsOverview)
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
