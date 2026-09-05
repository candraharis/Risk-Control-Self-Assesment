import cron from 'node-cron';
import { dbManager } from '../../database/db.ts';
import { actionPlansService } from '../../modules/action-plans/action-plans.service.ts';
import { notificationsService } from '../../modules/notifications/notifications.service.ts';
import { emailService } from '../email/email.service.ts';
import { auditService } from '../../modules/audit/audit.service.ts';
import { overdueDetection, reminderEligibility } from '../../../../shared/risk-scoring.ts';
import { ActionPlan, NotificationType } from '../../../../shared/types.ts';

export class SchedulerService {
  private cronJob: any = null;
  private isRunning = false;

  public init() {
    // Run every day at 08:00 AM server time (or configured schedule)
    const schedulePattern = process.env.CRON_SCHEDULE || '0 8 * * *';
    console.log(`[Scheduler] Initializing RCSA Enterprise Automated Scheduler with pattern: ${schedulePattern}`);

    this.cronJob = cron.schedule(schedulePattern, async () => {
      console.log(`[Scheduler] Triggering scheduled daily overdue & reminder scan at ${new Date().toISOString()}`);
      await this.runDailyJobs();
    });

    // Run a startup pass to ensure states are fresh
    setTimeout(() => {
      this.runDailyJobs().catch(err => console.error('[Scheduler Startup Error]', err));
    }, 3000);
  }

  /**
   * Core daily routine:
   * 1. Check all action plans for Overdue state (Section 16)
   * 2. Send Reminders (H-7, H-3, H-1, Due Date, Post-Due every 3 days) (Section 18)
   * 3. Escalations (>7 days to Risk Mgmt, >14 days to Management) (Section 19)
   */
  public async runDailyJobs(): Promise<{
    overdueUpdated: number;
    remindersSent: number;
    escalationsSent: number;
    details: string[];
  }> {
    if (this.isRunning) {
      return { overdueUpdated: 0, remindersSent: 0, escalationsSent: 0, details: ['Job already in progress'] };
    }

    this.isRunning = true;
    const details: string[] = [];
    let overdueUpdated = 0;
    let remindersSent = 0;
    let escalationsSent = 0;

    try {
      const plans = dbManager.getCollection<ActionPlan>('action_plans');
      const risks = dbManager.getCollection('risks');
      const users = dbManager.getCollection('users');
      const today = new Date();

      for (const plan of plans) {
        if (plan.status === 'COMPLETED') {
          continue; // Rule: Stop reminder when Action Plan = COMPLETED
        }

        const isOverdue = overdueDetection(plan.target_date, plan.status);
        const risk = risks.find(r => r.id === plan.risk_id);
        const pic = users.find(u => u.id === plan.pic_id);
        const manager = pic?.manager_id ? users.find(u => u.id === pic.manager_id) : null;
        const riskManagers = users.filter(u => u.role_id === 2);
        const executives = users.filter(u => u.role_id === 4);

        // 1. OVERDUE ENGINE (Section 16 & Rule 8)
        if (isOverdue && plan.status !== 'OVERDUE') {
          const oldStatus = plan.status;
          plan.status = 'OVERDUE';
          plan.updated_at = new Date().toISOString();
          overdueUpdated++;

          auditService.logActivity({
            userId: null,
            entity: 'ActionPlan',
            entityId: `AP-${plan.id}`,
            action: 'STATUS_CHANGE',
            fieldName: 'status',
            oldValue: oldStatus,
            newValue: 'OVERDUE',
            userAgent: 'RCSA Automated Overdue Scheduler'
          });

          details.push(`Marked Action Plan AP-${plan.id} as OVERDUE`);
        }

        // 2. REMINDER & ESCALATION ELIGIBILITY (Section 18, 19)
        const notificationType = reminderEligibility(plan.target_date, plan.status, today);
        if (!notificationType) {
          continue;
        }

        // Recipient Escalation Ladder:
        // Level 1: Risk Owner / PIC
        // Level 2: Manager
        // Level 3: Risk Management (overdue > 7d)
        // Level 4: Management (overdue > 14d)
        const targetRecipients: { id: number; email: string; name: string }[] = [];

        if (pic) {
          targetRecipients.push({ id: pic.id, email: pic.email, name: pic.name });
        }

        if (notificationType === 'ACTION_PLAN_H1' || notificationType === 'ACTION_PLAN_DUE' || notificationType === 'ACTION_PLAN_OVERDUE') {
          // Add Manager
          if (manager && !targetRecipients.some(r => r.id === manager.id)) {
            targetRecipients.push({ id: manager.id, email: manager.email, name: manager.name });
          }
        }

        if (notificationType === 'ESCALATION_7D') {
          // Escalation Level 3: Risk Management
          riskManagers.forEach(rm => {
            if (!targetRecipients.some(r => r.id === rm.id)) {
              targetRecipients.push({ id: rm.id, email: rm.email, name: rm.name });
            }
          });
          escalationsSent++;
        }

        if (notificationType === 'ESCALATION_14D') {
          // Escalation Level 4: Management / C-Level
          executives.forEach(exec => {
            if (!targetRecipients.some(r => r.id === exec.id)) {
              targetRecipients.push({ id: exec.id, email: exec.email, name: exec.name });
            }
          });
          escalationsSent++;
        }

        // Generate email template
        const emailTpl = emailService.createActionPlanReminderEmail({
          riskId: risk ? risk.risk_id : `RSK-${plan.risk_id}`,
          riskEvent: risk ? risk.risk_event : 'Mitigation Action Plan',
          actionPlan: plan.action_plan,
          picName: pic ? pic.name : 'Action Plan PIC',
          priority: plan.priority,
          targetDate: plan.target_date,
          progress: plan.progress,
          notificationType
        });

        for (const recipient of targetRecipients) {
          const result = await notificationsService.sendNotification({
            risk_id: plan.risk_id,
            action_plan_id: plan.id,
            recipient_id: recipient.id,
            recipient_email: recipient.email,
            recipient_name: recipient.name,
            notification_type: notificationType,
            subject: emailTpl.subject,
            body: `Action Plan Reminder: ${plan.action_plan}. Status: ${plan.status}, Progress: ${plan.progress}%.`,
            html: emailTpl.html
          });

          if (result.sent) {
            remindersSent++;
            details.push(`Sent ${notificationType} to ${recipient.email} for AP-${plan.id}`);
          }
        }
      }

      dbManager.persist();
      return { overdueUpdated, remindersSent, escalationsSent, details };
    } finally {
      this.isRunning = false;
    }
  }
}

export const schedulerService = new SchedulerService();
