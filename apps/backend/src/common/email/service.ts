import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? 'Agenvik <notifications@agenvik.com>';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY is not set — skipping email');
    return null;
  }
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export interface LeadNotificationData {
  to: string;
  agentName: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
}

export interface DocumentEmailData {
  to: string;
  documentTitle: string;
}

export abstract class EmailService {
  static async sendLeadNotification(data: LeadNotificationData): Promise<void> {
    const client = getClient();
    if (!client) return;

    const displayName = data.lead.name ?? 'Anonymous';

    await client.emails.send({
      from,
      to: data.to,
      subject: `New lead captured: ${displayName}`,
      html: leadNotificationHtml(data),
    });
  }

  static async sendDocumentIndexed(data: DocumentEmailData): Promise<void> {
    const client = getClient();
    if (!client) return;

    console.log('coming here ', from, data);

    await client.emails.send({
      from,
      to: data.to,
      subject: `"${data.documentTitle}" is ready`,
      html: documentIndexedHtml(data.documentTitle),
    });
  }

  static async sendDocumentFailed(data: DocumentEmailData): Promise<void> {
    const client = getClient();
    if (!client) return;

    await client.emails.send({
      from,
      to: data.to,
      subject: `Indexing failed: "${data.documentTitle}"`,
      html: documentFailedHtml(data.documentTitle),
    });
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
${content}
<hr style="border:none;border-top:1px solid #eee;margin-top:32px"/>
<p style="font-size:12px;color:#888">Agenvik · You received this because you own an agent on Agenvik.</p>
</body>
</html>`;
}

function row(label: string, value: string | null): string {
  if (!value) return '';
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#555;font-size:14px;white-space:nowrap">${label}</td>
    <td style="padding:6px 0;font-size:14px">${value}</td>
  </tr>`;
}

function leadNotificationHtml(data: LeadNotificationData): string {
  const { lead, agentName } = data;
  return wrap(`
<h2 style="margin:0 0 16px">New lead captured</h2>
<p style="color:#555;margin:0 0 20px">Your agent <strong>${agentName}</strong> captured a new lead.</p>
<table style="border-collapse:collapse;width:100%">
  ${row('Name', lead.name)}
  ${row('Email', lead.email)}
  ${row('Phone', lead.phone)}
  ${row('Company', lead.company)}
</table>`);
}

function documentIndexedHtml(title: string): string {
  return wrap(`
<h2 style="margin:0 0 16px">Knowledge source ready</h2>
<p style="color:#555;margin:0 0 20px"><strong>${title}</strong> has been successfully indexed and is ready to use in your agent.</p>`);
}

function documentFailedHtml(title: string): string {
  return wrap(`
<h2 style="margin:0 0 16px">Indexing failed</h2>
<p style="color:#555;margin:0 0 20px">We were unable to index <strong>${title}</strong>. Please review the document content and try retraining.</p>`);
}
