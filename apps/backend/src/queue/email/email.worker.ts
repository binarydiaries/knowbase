import { type Job, Worker } from 'bullmq';
import { clerkClient } from 'elysia-clerk';
import { EmailService } from '../../common/email/service';
import { connection } from '../connection';
import { emailQueue } from './email.queue';
import type { IEmailJob } from './email.types';

async function getClerkUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}

export const emailWorker = new Worker(
  emailQueue.name,
  async (job: Job<IEmailJob>) => {
    const data = job.data;

    if (data.type === 'send-email') {
      await EmailService.send({ to: data.to, subject: data.subject, html: data.html });
      return;
    }

    // document-indexed or document-failed
    const to = await getClerkUserEmail(data.userId);
    if (!to) return;

    if (data.type === 'document-indexed') {
      await EmailService.sendDocumentIndexed({ to, documentTitle: data.documentTitle });
    } else {
      await EmailService.sendDocumentFailed({ to, documentTitle: data.documentTitle });
    }
  },
  { connection },
);

emailWorker.on('failed', (job, err) => {
  console.error(`[email-worker] job ${job?.id} failed:`, err.message);
});
