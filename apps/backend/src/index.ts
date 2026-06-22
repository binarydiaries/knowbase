import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';
import { logger } from './utils/logger.utils';

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
} else {
  await import('./server');
  logger.info({ pid: process.pid }, 'worker started');
}
