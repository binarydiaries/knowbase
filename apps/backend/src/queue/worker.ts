import * as Sentry from '@sentry/elysia';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENV_KEY ?? 'development',
  tracesSampleRate: 0.2,
});

import './indexing/indexing.worker';
import './email/email.worker';
