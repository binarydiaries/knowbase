export interface ILeadNotificationJob {
  type: 'lead-notification';
  leadId: string;
  agentId: string;
  orgId: string;
}

export interface IDocumentEmailJob {
  type: 'document-indexed' | 'document-failed';
  documentId: string;
  userId: string;
  documentTitle: string;
}

export type IEmailJob = ILeadNotificationJob | IDocumentEmailJob;
