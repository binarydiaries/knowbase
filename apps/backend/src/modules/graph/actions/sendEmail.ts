import { clerkClient } from 'elysia-clerk';
import { EmailService } from '../../../common/email/service';
import { addEmailJob } from '../../../queue/email/email.queue';
import { AgentService } from '../../agent/service';
import { SendEmailConfigSchema } from '../../intent/model';
import type { ActionContext, IActionResult } from './types';

async function getClerkOwnerEmail(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}

export async function sendEmail(ctx: ActionContext): Promise<IActionResult> {
  // Parse optional subject/body overrides from the action config.
  const parsed = SendEmailConfigSchema.safeParse(ctx.config);
  const subjectOverride = parsed.success ? parsed.data.subject : undefined;
  const bodyOverride = parsed.success ? parsed.data.body : undefined;

  // Resolve the recipient: look up the agent owner's email via Clerk.
  const agent = await AgentService.single({ id: ctx.agentId, orgId: ctx.orgId });
  if (!agent?.createdBy) {
    return { success: false, error: 'send_email: agent has no owner' };
  }

  const to = await getClerkOwnerEmail(agent.createdBy);
  if (!to) {
    return { success: false, error: 'send_email: could not resolve recipient email' };
  }

  // Build the email content from entities already in state (no extra DB lookup).
  const { name, email, phone, company } = ctx.entities;
  const { subject, html } = EmailService.renderLeadNotification({
    agentName: agent.name,
    lead: {
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      company: company ?? null,
    },
    subject: subjectOverride,
    body: bodyOverride,
  });

  // Enqueue a generic send-email job — the queue knows nothing about leads.
  await addEmailJob({ type: 'send-email', to, subject, html });
  return { success: true };
}
