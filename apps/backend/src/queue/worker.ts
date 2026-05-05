import * as Sentry from '@sentry/elysia';

Sentry.init({
  dsn: 'https://c9a6f1f3bd7cfafb990c1d3ef07c518d@o4505526005399552.ingest.us.sentry.io/4511332466884609',
  environment: process.env.ENV_KEY ?? 'development',
  tracesSampleRate: 0.2,
});

import './indexing/indexing.worker';
import './email/email.worker';
