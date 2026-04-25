import { Queue } from 'bullmq';
import { connection } from '../connection';
import type { IEmailJob } from './email.types';

export const emailQueue = new Queue('email-notifications', { connection });

export const addEmailJob = (data: IEmailJob) =>
  emailQueue.add('send-email', data);
