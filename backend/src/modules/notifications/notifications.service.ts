import { dbManager } from '../../database/db.ts';
import { NotificationLog, NotificationType, NotificationStatus, RiskRating } from '../../../../shared/types.ts';
import { emailService } from '../../services/email/email.service.ts';
import { emailDeduplication } from '../../../../shared/risk-scoring.ts';
import { auditService } from '../audit/audit.service.ts';

export class NotificationsService {
  public getAllNotifications(filters?: { status?: string; notification_type?: string }): NotificationLog[] {
    let logs = [...dbManager.getCollection<NotificationLog>('notifications')];
    const risks = dbManager.getCollection('risks');

    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.status) {
      logs = logs.filter(l => l.status === filters.status);
    }
    if (filters?.notification_type) {
      logs = logs.filter(l => l.notification_type === filters.notification_type);
    }

    return logs.map(l => {
      const risk = risks.find(r => r.id === l.risk_id);
      return {
        ...l,
        risk_ref: risk ? { risk_id: risk.risk_id, risk_event: risk.risk_event } : undefined
      };
    });
  }

  /**
   * Idempotent notification logging and sending
   */
  public async sendNotification(data: {
    risk_id?: number | null;
    action_plan_id?: number | null;
    recipient_id: number;
    recipient_email: string;
    recipient_name?: string;
    notification_type: NotificationType;
    subject: string;
    body: string;
    html?: string;
  }): Promise<{ sent: boolean; reason?: string }> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const notifications = dbManager.getCollection<NotificationLog>('notifications');

    // Section 21: IDEMPOTENCY CHECK
    // Jangan mengirim email reminder dua kali pada hari yang sama untuk event yang sama
    const alreadySentToday = notifications.some(n => {
      const nDate = n.notification_date ? n.notification_date.slice(0, 10) : n.created_at.slice(0, 10);
      return (
        n.risk_id === (data.risk_id || null) &&
        n.action_plan_id === (data.action_plan_id || null) &&
        n.notification_type === data.notification_type &&
        n.recipient_email.toLowerCase() === data.recipient_email.toLowerCase() &&
        nDate === todayStr &&
        n.status === 'SENT'
      );
    });

    if (alreadySentToday) {
      return { sent: false, reason: 'Duplicate notification suppressed by Idempotency Engine for today' };
    }

    const id = dbManager.nextId('notifications');

    let sendResult: { success: boolean; error?: string } = { success: false, error: '' };
    try {
      sendResult = await emailService.send({
        to: data.recipient_email,
        subject: data.subject,
        html: data.html || `<p>${data.body}</p>`,
        text: data.body,
        riskId: data.risk_id ? `RSK-${data.risk_id}` : undefined,
        actionPlanId: data.action_plan_id || undefined,
        notificationType: data.notification_type
      });
    } catch (err: any) {
      sendResult = { success: false, error: err.message };
    }

    const newLog: NotificationLog = {
      id,
      risk_id: data.risk_id || null,
      action_plan_id: data.action_plan_id || null,
      recipient_id: data.recipient_id,
      recipient_email: data.recipient_email,
      recipient_name: data.recipient_name,
      notification_type: data.notification_type,
      subject: data.subject,
      body: data.body,
      sent_at: sendResult.success ? new Date().toISOString() : null,
      status: sendResult.success ? 'SENT' : 'FAILED',
      error_message: sendResult.success ? null : sendResult.error || 'Delivery failed',
      notification_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    dbManager.getState().notifications.push(newLog);
    dbManager.persist();

    auditService.logActivity({
      userId: data.recipient_id,
      entity: 'Notification',
      entityId: `NOTIF-${id}`,
      action: 'EMAIL_SENT',
      newValue: `[${data.notification_type}] to ${data.recipient_email} (${newLog.status})`
    });

    return { sent: sendResult.success, reason: sendResult.error };
  }

  /**
   * Rule 6 & Section 17: Email Alert on Risk Submit
   * When user submits risk: If MODERATE, HIGH, EXTREME, send email to Risk Owner, Manager, Risk Management
   */
  public async triggerRiskSubmitAlert(risk: any, submittedByUser: any) {
    if (risk.inherent_rating === 'LOW') {
      return; // Only Moderate, High, Extreme triggers alerts
    }

    const users = dbManager.getCollection('users');
    const units = dbManager.getCollection('units');
    const unit = units.find(u => u.id === risk.unit_id);
    const owner = users.find(u => u.id === risk.risk_owner_id);
    const manager = owner?.manager_id ? users.find(u => u.id === owner.manager_id) : null;
    const riskManagers = users.filter(u => u.role_id === 2); // RISK_MANAGEMENT

    const recipients: { id: number; email: string; name: string }[] = [];

    if (owner) {
      recipients.push({ id: owner.id, email: owner.email, name: owner.name });
    }
    if (manager && !recipients.some(r => r.id === manager.id)) {
      recipients.push({ id: manager.id, email: manager.email, name: manager.name });
    }
    riskManagers.forEach(rm => {
      if (!recipients.some(r => r.id === rm.id)) {
        recipients.push({ id: rm.id, email: rm.email, name: rm.name });
      }
    });

    const emailTemplate = emailService.createRiskSubmissionEmail({
      riskId: risk.risk_id,
      riskEvent: risk.risk_event,
      unit: unit ? unit.name : 'Financial Unit',
      riskOwner: owner ? owner.name : 'Risk Owner',
      inherentLikelihood: risk.inherent_likelihood,
      inherentImpact: risk.inherent_impact,
      inherentScore: risk.inherent_score,
      inherentRating: risk.inherent_rating as RiskRating,
      existingControlSummary: `Controls registered (${risk.controls?.length || 1} items)`,
      residualScore: risk.residual_score,
      residualRating: risk.residual_rating as RiskRating
    });

    for (const recipient of recipients) {
      await this.sendNotification({
        risk_id: risk.id,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        notification_type: 'RISK_HIGH_ALERT',
        subject: emailTemplate.subject,
        body: `RCSA ALERT: Risk assessment ${risk.risk_id} with rating ${risk.inherent_rating} has been submitted.`,
        html: emailTemplate.html
      });
    }
  }

  /**
   * Admin test email dispatcher
   */
  public async sendTestEmail(targetEmail: string, recipientName: string = 'Enterprise User') {
    const template = emailService.createRiskSubmissionEmail({
      riskId: 'RSK-TEST-99999',
      riskEvent: 'Test Simulated Enterprise Risk Alert (System Verification)',
      unit: 'Direktorat Manajemen Risiko',
      riskOwner: recipientName,
      inherentLikelihood: 4,
      inherentImpact: 5,
      inherentScore: 20,
      inherentRating: 'EXTREME',
      existingControlSummary: 'Automated Diagnostic Control Verification',
      residualScore: 8,
      residualRating: 'MODERATE'
    });

    return await this.sendNotification({
      risk_id: null,
      recipient_id: 1,
      recipient_email: targetEmail,
      recipient_name: recipientName,
      notification_type: 'RISK_HIGH_ALERT',
      subject: `[SYSTEM TEST] ${template.subject}`,
      body: 'This is a test enterprise notification to verify email provider connectivity.',
      html: template.html
    });
  }
}

export const notificationsService = new NotificationsService();
