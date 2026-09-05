export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  riskId?: string;
  actionPlanId?: number;
  notificationType?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface IEmailProvider {
  name: string;
  sendEmail(options: EmailOptions): Promise<EmailSendResult>;
}
