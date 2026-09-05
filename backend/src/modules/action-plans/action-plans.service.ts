import { dbManager } from '../../database/db.ts';
import { ActionPlan, ActionPlanPriority, ActionPlanStatus } from '../../../../shared/types.ts';
import { overdueDetection } from '../../../../shared/risk-scoring.ts';
import { auditService } from '../audit/audit.service.ts';

export class ActionPlansService {
  public getAllActionPlans(filters?: { risk_id?: number; status?: string; pic_id?: number }): ActionPlan[] {
    let plans = [...dbManager.getCollection<ActionPlan>('action_plans')];
    const users = dbManager.getCollection('users');

    if (filters?.risk_id) {
      plans = plans.filter(p => p.risk_id === Number(filters.risk_id));
    }
    if (filters?.status) {
      plans = plans.filter(p => p.status === filters.status);
    }
    if (filters?.pic_id) {
      plans = plans.filter(p => p.pic_id === Number(filters.pic_id));
    }

    return plans.map(p => {
      const pic = users.find(u => u.id === p.pic_id);
      return {
        ...p,
        pic: pic ? { id: pic.id, name: pic.name, email: pic.email } : undefined
      };
    });
  }

  public getActionPlanById(id: number): ActionPlan | null {
    const plans = this.getAllActionPlans();
    return plans.find(p => p.id === Number(id)) || null;
  }

  public createActionPlan(data: {
    risk_id: number;
    action_plan: string;
    pic_id: number;
    priority: ActionPlanPriority;
    target_date: string;
    progress?: number;
    status?: ActionPlanStatus;
    remarks?: string | null;
    evidence?: string | null;
    userId?: number;
  }): ActionPlan {
    const id = dbManager.nextId('action_plans');
    const initialProgress = data.progress !== undefined ? Number(data.progress) : 0;
    
    let initialStatus: ActionPlanStatus = data.status || (initialProgress === 100 ? 'COMPLETED' : initialProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');
    if (initialStatus !== 'COMPLETED' && overdueDetection(data.target_date, initialStatus)) {
      initialStatus = 'OVERDUE';
    }

    const newPlan: ActionPlan = {
      id,
      risk_id: Number(data.risk_id),
      action_plan: data.action_plan,
      pic_id: Number(data.pic_id),
      priority: data.priority,
      target_date: new Date(data.target_date).toISOString(),
      progress: initialProgress,
      status: initialStatus,
      completion_date: initialStatus === 'COMPLETED' ? new Date().toISOString() : null,
      remarks: data.remarks || null,
      evidence: data.evidence || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbManager.getState().action_plans.push(newPlan);
    dbManager.persist();

    auditService.logActivity({
      userId: data.userId || data.pic_id,
      entity: 'ActionPlan',
      entityId: `AP-${id}`,
      action: 'CREATE',
      newValue: `Created action plan: ${data.action_plan} (Target: ${newPlan.target_date})`
    });

    return newPlan;
  }

  public updateActionPlan(id: number, updates: Partial<ActionPlan>, userId?: number): ActionPlan {
    const plans = dbManager.getCollection<ActionPlan>('action_plans');
    const plan = plans.find(p => p.id === Number(id));
    if (!plan) {
      throw new Error(`Action Plan with ID ${id} not found`);
    }

    const oldStatus = plan.status;
    const oldProgress = plan.progress;

    if (updates.progress !== undefined) {
      plan.progress = Math.min(100, Math.max(0, Number(updates.progress)));
      if (plan.progress === 100) {
        plan.status = 'COMPLETED';
        plan.completion_date = new Date().toISOString();
      } else if (plan.progress > 0 && plan.status === 'NOT_STARTED') {
        plan.status = 'IN_PROGRESS';
      }
    }

    if (updates.status !== undefined) {
      plan.status = updates.status;
      if (plan.status === 'COMPLETED') {
        plan.progress = 100;
        plan.completion_date = plan.completion_date || new Date().toISOString();
      } else {
        plan.completion_date = null;
      }
    }

    // Overdue check
    if (plan.status !== 'COMPLETED') {
      const target = updates.target_date || plan.target_date;
      if (overdueDetection(target, plan.status)) {
        plan.status = 'OVERDUE';
      }
    }

    if (updates.action_plan !== undefined) plan.action_plan = updates.action_plan;
    if (updates.pic_id !== undefined) plan.pic_id = Number(updates.pic_id);
    if (updates.priority !== undefined) plan.priority = updates.priority;
    if (updates.target_date !== undefined) plan.target_date = new Date(updates.target_date).toISOString();
    if (updates.remarks !== undefined) plan.remarks = updates.remarks;
    if (updates.evidence !== undefined) plan.evidence = updates.evidence;

    plan.updated_at = new Date().toISOString();
    dbManager.persist();

    auditService.logActivity({
      userId: userId || null,
      entity: 'ActionPlan',
      entityId: `AP-${id}`,
      action: 'UPDATE',
      fieldName: 'status/progress',
      oldValue: `${oldStatus} (${oldProgress}%)`,
      newValue: `${plan.status} (${plan.progress}%)`
    });

    return plan;
  }
}

export const actionPlansService = new ActionPlansService();
