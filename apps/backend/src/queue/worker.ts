import * as Sentry from '@sentry/elysia';

if (process.env.ENV_KEY === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV_KEY,
    tracesSampleRate: 0.2,
  });
}

import './indexing/indexing.worker';
import './email/email.worker';
