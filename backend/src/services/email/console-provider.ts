import { IEmailProvider, EmailOptions, EmailSendResult } from './email-provider.interface.ts';

export class ConsoleEmailProvider implements IEmailProvider {
  name = 'Console/Mock Provider';

  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    const timestamp = new Date().toISOString();
    console.log(`\n================== [ENTERPRISE EMAIL DISPATCHED] ==================`);
    console.log(`Time:    ${timestamp}`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Type:    ${options.notificationType || 'GENERAL'}`);
    console.log(`------------------------------------------------------------------`);
    console.log(options.text || options.html.replace(/<[^>]*>?/gm, ' '));
    console.log(`==================================================================\n`);

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      provider: this.name
    };
  }
}
