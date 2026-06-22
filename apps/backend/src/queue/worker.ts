import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import * as Sentry from '@sentry/elysia';
import { createOtelResource, createOtelSpanProcessor } from '../utils/otel';

new NodeTracerProvider({
  resource: createOtelResource('agenvik-backend-worker'),
  spanProcessors: [createOtelSpanProcessor()],
}).register();

if (process.env.ENV_KEY === 'prod') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV_KEY,
    tracesSampleRate: 0.2,
  });
}

import './indexing/indexing.worker';
import './email/email.worker';
