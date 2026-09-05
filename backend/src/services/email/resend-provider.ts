import { IEmailProvider, EmailOptions, EmailSendResult } from './email-provider.interface.ts';

export class ResendEmailProvider implements IEmailProvider {
  name = 'Resend Provider';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || '';
  }

  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    if (!this.apiKey) {
      console.log(`[Resend Provider] Simulation mode (No RESEND_API_KEY set). Target: ${options.to}`);
      return {
        success: true,
        messageId: `resend_sim_${Date.now()}`,
        provider: this.name
      };
    }

    try {
      // Integration hook with Resend API
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'onboarding@resend.dev',
          to: [options.to],
          subject: options.subject,
          html: options.html
        })
      });

      if (!res.ok) {
        const errorData = await res.text();
        return { success: false, error: errorData, provider: this.name };
      }

      const data = await res.json();
      return { success: true, messageId: data.id, provider: this.name };
    } catch (err: any) {
      return { success: false, error: err.message, provider: this.name };
    }
  }
}
