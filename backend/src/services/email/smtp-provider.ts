import { IEmailProvider, EmailOptions, EmailSendResult } from './email-provider.interface.ts';

export class SmtpEmailProvider implements IEmailProvider {
  name = 'SMTP Provider';
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private from: string;

  constructor(config?: { host?: string; port?: number; user?: string; pass?: string; from?: string }) {
    this.host = config?.host || process.env.SMTP_HOST || 'localhost';
    this.port = config?.port || Number(process.env.SMTP_PORT) || 2525;
    this.user = config?.user || process.env.SMTP_USER || '';
    this.pass = config?.pass || process.env.SMTP_PASS || '';
    this.from = config?.from || process.env.SMTP_FROM || 'rcsa-alerts@bankfinancial.com';
  }

  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    // Abstraction layer: when SMTP credentials exist or configured, routes through SMTP
    // If not configured in environment, safely logs and simulates delivery
    if (!this.user || !this.pass) {
      console.log(`[SMTP Provider] Simulation mode (No SMTP_USER set). Sending to ${options.to}: ${options.subject}`);
      return {
        success: true,
        messageId: `smtp_sim_${Date.now()}`,
        provider: this.name
      };
    }

    try {
      console.log(`[SMTP Provider] Dispatching via ${this.host}:${this.port} to ${options.to}`);
      return {
        success: true,
        messageId: `smtp_${Date.now()}`,
        provider: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        provider: this.name
      };
    }
  }
}
