export interface ISendEmailJob {
  type: 'send-email';
  to: string;
  subject: string;
  html: string;
}

export interface IDocumentEmailJob {
  type: 'document-indexed' | 'document-failed';
  documentId: string;
  userId: string;
  documentTitle: string;
}


export type IEmailJob = ISendEmailJob | IDocumentEmailJob;
