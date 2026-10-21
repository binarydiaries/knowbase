import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';
import { logger } from './utils/logger.utils';

if (cluster.isPrimary) {
  const workerCount = Number(
    process.env.WEB_CONCURRENCY ?? os.availableParallelism(),
  );
  if (!Number.isInteger(workerCount) || workerCount < 1 || workerCount > 64) {
    throw new Error('WEB_CONCURRENCY must be an integer between 1 and 64');
  }
  for (let i = 0; i < workerCount; i++) cluster.fork();
} else {
  await import('./server');
  logger.info({ pid: process.pid }, 'worker started');
}
