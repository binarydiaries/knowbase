import { logger } from './logger.utils';

const log = logger.child({ module: 'startup' });

const REQUIRED_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'OPENAI_API_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'TOKEN_ENCRYPTION_KEY',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    log.error({ missing }, 'missing required environment variables');
    process.exit(1);
  }

  const encKey = process.env.TOKEN_ENCRYPTION_KEY ?? '';
  if (!/^[a-f\d]{64}$/i.test(encKey)) {
    log.error(
      'TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)',
    );
    process.exit(1);
  }
}
