import { dbManager } from '../../database/db.ts';
import {
  Risk,
  RiskRating,
  RiskResponse,
  RiskStatus,
  MatrixCellSummary,
  ControlType,
  ControlFrequency,
  EffectivenessLevel,
  ActionPlanPriority
} from '../../../../shared/types.ts';
import {
  calculateRiskScore,
  calculateControlEffectiveness,
  validateResidualRisk
} from '../../../../shared/risk-scoring.ts';
import { auditService } from '../audit/audit.service.ts';
import { controlsService } from '../controls/controls.service.ts';
import { actionPlansService } from '../action-plans/action-plans.service.ts';
import { notificationsService } from '../notifications/notifications.service.ts';

export interface CreateRiskInput {
  unit_id: number;
  risk_owner_id: number;
  risk_category_id: number;
  business_process: string;
  sub_process: string;
  risk_event: string;
  risk_description: string;
  risk_cause: string;
  risk_impact_description: string;
  inherent_likelihood: number;
  inherent_impact: number;
  residual_likelihood: number;
  residual_impact: number;
  residual_justification?: string | null;
  risk_response: RiskResponse;
  risk_response_justification?: string | null;
  status?: RiskStatus;
  controls?: Array<{
    control_name: string;
    control_description: string;
    control_objective: string;
    control_type: ControlType;
    control_frequency: ControlFrequency;
    control_owner_id: number;
    control_design_effectiveness: EffectivenessLevel;
    control_operating_effectiveness: EffectivenessLevel;
    evidence?: string | null;
  }>;
  action_plans?: Array<{
    action_plan: string;
    pic_id: number;
    priority: ActionPlanPriority;
    target_date: string;
    remarks?: string | null;
  }>;
}

export class RisksService {
  /**
   * Generates sequential Risk ID: RSK-{YEAR}-{SEQUENTIAL} e.g. RSK-2026-00031
   */
  private generateNextRiskId(): string {
    const year = new Date().getFullYear();
    const risks = dbManager.getCollection<Risk>('risks');
    const count = risks.length + 1;
    return `RSK-${year}-${count.toString().padStart(5, '0')}`;
  }

  public getAllRisks(filters?: {
    unit_id?: number;
    risk_category_id?: number;
    risk_owner_id?: number;
    inherent_rating?: string;
    residual_rating?: string;
    status?: string;
    search?: string;
    inherent_likelihood?: number;
    inherent_impact?: number;
    residual_likelihood?: number;
    residual_impact?: number;
  }): Risk[] {
    let risks = [...dbManager.getCollection<Risk>('risks')];
    const units = dbManager.getCollection('units');
    const categories = dbManager.getCollection('risk_categories');
    const users = dbManager.getCollection('users');

    // Sorting: Newest first
    risks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.unit_id) {
      risks = risks.filter(r => r.unit_id === Number(filters.unit_id));
    }
    if (filters?.risk_category_id) {
      risks = risks.filter(r => r.risk_category_id === Number(filters.risk_category_id));
    }
    if (filters?.risk_owner_id) {
      risks = risks.filter(r => r.risk_owner_id === Number(filters.risk_owner_id));
    }
    if (filters?.inherent_rating) {
      risks = risks.filter(r => r.inherent_rating === filters.inherent_rating);
    }
    if (filters?.residual_rating) {
      risks = risks.filter(r => r.residual_rating === filters.residual_rating);
    }
    if (filters?.status) {
      risks = risks.filter(r => r.status === filters.status);
    }
    if (filters?.inherent_likelihood) {
      risks = risks.filter(r => r.inherent_likelihood === Number(filters.inherent_likelihood));
    }
    if (filters?.inherent_impact) {
      risks = risks.filter(r => r.inherent_impact === Number(filters.inherent_impact));
    }
    if (filters?.residual_likelihood) {
      risks = risks.filter(r => r.residual_likelihood === Number(filters.residual_likelihood));
    }
    if (filters?.residual_impact) {
      risks = risks.filter(r => r.residual_impact === Number(filters.residual_impact));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      risks = risks.filter(
        r =>
          r.risk_id.toLowerCase().includes(q) ||
          r.risk_event.toLowerCase().includes(q) ||
          r.business_process.toLowerCase().includes(q) ||
          r.risk_description.toLowerCase().includes(q)
      );
    }

    // Attach relational models
    return risks.map(r => {
      const unit = units.find(u => u.id === r.unit_id);
      const cat = categories.find(c => c.id === r.risk_category_id);
      const owner = users.find(u => u.id === r.risk_owner_id);
      return {
        ...r,
        unit,
        risk_category: cat,
        risk_owner: owner ? (owner as any) : undefined
      };
    });
  }

  public getRiskById(id: number | string): Risk | null {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = typeof id === 'number' 
      ? risks.find(r => r.id === id)
      : risks.find(r => r.id === Number(id) || r.risk_id === id);

    if (!risk) return null;

    const units = dbManager.getCollection('units');
    const categories = dbManager.getCollection('risk_categories');
    const users = dbManager.getCollection('users');
    const allApprovals = dbManager.getCollection('approval_histories');

    const unit = units.find(u => u.id === risk.unit_id);
    const cat = categories.find(c => c.id === risk.risk_category_id);
    const owner = users.find(u => u.id === risk.risk_owner_id);
    const creator = users.find(u => u.id === risk.created_by);

    const controls = controlsService.getControlsByRiskId(risk.id);
    const actionPlans = actionPlansService.getAllActionPlans({ risk_id: risk.id });
    
    const approvals = allApprovals
      .filter((a: any) => a.risk_id === risk.id)
      .map((a: any) => {
        const u = users.find(user => user.id === a.user_id);
        return {
          ...a,
          user: u ? { id: u.id, name: u.name, email: u.email } : undefined
        };
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      ...risk,
      unit,
      risk_category: cat,
      risk_owner: owner ? (owner as any) : undefined,
      creator: creator ? (creator as any) : undefined,
      controls,
      action_plans: actionPlans,
      approval_histories: approvals
    };
  }

  /**
   * Centralized Risk Creation with Backend Calculation (Source of Truth)
   */
  public async createRisk(input: CreateRiskInput, creatorUserId: number): Promise<Risk> {
    // 1. Centralized Inherent Risk Calculation (Rule 1-5)
    const inherent = calculateRiskScore(input.inherent_likelihood, input.inherent_impact);

    // 2. Centralized Residual Risk Calculation
    const residual = calculateRiskScore(input.residual_likelihood, input.residual_impact);

    // 3. Residual Risk Validation (Section 13)
    const resValidation = validateResidualRisk(inherent.score, residual.score, input.residual_justification);
    if (!resValidation.valid) {
      throw new Error(
        'Residual risk cannot exceed inherent risk without documented justification (minimum 10 characters).'
      );
    }

    // 4. Risk Response Validation (Section 14)
    if ((inherent.rating === 'HIGH' || inherent.rating === 'EXTREME') && input.risk_response === 'ACCEPT') {
      if (!input.risk_response_justification || input.risk_response_justification.trim().length < 10) {
        throw new Error(
          'Risk response ACCEPT for HIGH or EXTREME risk requires documented justification and Risk Management approval.'
        );
      }
    }

    const id = dbManager.nextId('risks');
    const riskIdCode = this.generateNextRiskId();
    const initialStatus: RiskStatus = input.status || 'DRAFT';

    const newRisk: Risk = {
      id,
      risk_id: riskIdCode,
      unit_id: Number(input.unit_id),
      risk_owner_id: Number(input.risk_owner_id),
      risk_category_id: Number(input.risk_category_id),
      business_process: input.business_process,
      sub_process: input.sub_process,
      risk_event: input.risk_event,
      risk_description: input.risk_description,
      risk_cause: input.risk_cause,
      risk_impact_description: input.risk_impact_description,
      inherent_likelihood: input.inherent_likelihood,
      inherent_impact: input.inherent_impact,
      inherent_score: inherent.score,
      inherent_rating: inherent.rating,
      residual_likelihood: input.residual_likelihood,
      residual_impact: input.residual_impact,
      residual_score: residual.score,
      residual_rating: residual.rating,
      residual_justification: input.residual_justification || null,
      risk_response: input.risk_response,
      risk_response_justification: input.risk_response_justification || null,
      status: initialStatus,
      created_by: creatorUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbManager.getState().risks.push(newRisk);

    // Add controls if provided
    if (input.controls && input.controls.length > 0) {
      for (const c of input.controls) {
        controlsService.createControl({
          risk_id: id,
          control_name: c.control_name,
          control_description: c.control_description,
          control_objective: c.control_objective,
          control_type: c.control_type,
          control_frequency: c.control_frequency,
          control_owner_id: c.control_owner_id,
          control_design_effectiveness: c.control_design_effectiveness,
          control_operating_effectiveness: c.control_operating_effectiveness,
          evidence: c.evidence,
          userId: creatorUserId
        });
      }
    }

    // Add action plans if provided
    if (input.action_plans && input.action_plans.length > 0) {
      for (const a of input.action_plans) {
        actionPlansService.createActionPlan({
          risk_id: id,
          action_plan: a.action_plan,
          pic_id: a.pic_id,
          priority: a.priority,
          target_date: a.target_date,
          remarks: a.remarks,
          userId: creatorUserId
        });
      }
    }

    // Add initial approval history entry
    const approvalId = dbManager.nextId('approval_histories');
    dbManager.getState().approval_histories.push({
      id: approvalId,
      risk_id: id,
      user_id: creatorUserId,
      action: initialStatus === 'SUBMITTED' ? 'SUBMIT' : 'CREATE',
      comments: initialStatus === 'SUBMITTED' ? 'Submitted upon risk assessment creation' : 'Created draft assessment',
      created_at: new Date().toISOString()
    });

    // Audit log
    auditService.logActivity({
      userId: creatorUserId,
      entity: 'Risk',
      entityId: riskIdCode,
      action: 'CREATE',
      newValue: `Created ${riskIdCode} (Inherent: ${inherent.score} ${inherent.rating}, Status: ${initialStatus})`
    });

    dbManager.persist();

    // Trigger submit alerts if submitted immediately
    if (initialStatus === 'SUBMITTED') {
      await notificationsService.triggerRiskSubmitAlert(newRisk, { id: creatorUserId });
    }

    return this.getRiskById(id)!;
  }

  public async updateRisk(id: number, input: Partial<CreateRiskInput>, userId: number): Promise<Risk> {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = risks.find(r => r.id === Number(id));
    if (!risk) {
      throw new Error(`Risk with ID ${id} not found`);
    }

    if (risk.status === 'APPROVED' || risk.status === 'CLOSED') {
      throw new Error(`Cannot modify risk with status ${risk.status}. Must request revision first.`);
    }

    const inL = input.inherent_likelihood !== undefined ? input.inherent_likelihood : risk.inherent_likelihood;
    const inI = input.inherent_impact !== undefined ? input.inherent_impact : risk.inherent_impact;
    const inherent = calculateRiskScore(inL, inI);

    const resL = input.residual_likelihood !== undefined ? input.residual_likelihood : risk.residual_likelihood;
    const resI = input.residual_impact !== undefined ? input.residual_impact : risk.residual_impact;
    const residual = calculateRiskScore(resL, resI);

    const just = input.residual_justification !== undefined ? input.residual_justification : risk.residual_justification;
    const resValidation = validateResidualRisk(inherent.score, residual.score, just);
    if (!resValidation.valid) {
      throw new Error('Residual risk cannot exceed inherent risk without documented justification.');
    }

    Object.assign(risk, {
      ...input,
      inherent_likelihood: inL,
      inherent_impact: inI,
      inherent_score: inherent.score,
      inherent_rating: inherent.rating,
      residual_likelihood: resL,
      residual_impact: resI,
      residual_score: residual.score,
      residual_rating: residual.rating,
      residual_justification: just,
      updated_at: new Date().toISOString()
    });

    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'UPDATE',
      newValue: `Updated risk ${risk.risk_id}`
    });

    dbManager.persist();
    return this.getRiskById(id)!;
  }

  /**
   * Workflow transition: SUBMIT
   * DRAFT / REVISION_REQUIRED -> SUBMITTED
   */
  public async submitRisk(id: number, userId: number, comments?: string): Promise<Risk> {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = risks.find(r => r.id === Number(id));
    if (!risk) throw new Error('Risk not found');

    if (risk.status !== 'DRAFT' && risk.status !== 'REVISION_REQUIRED') {
      throw new Error(`Risk cannot be submitted from status ${risk.status}`);
    }

    const oldStatus = risk.status;
    risk.status = 'SUBMITTED';
    risk.updated_at = new Date().toISOString();

    // Log approval history
    dbManager.getState().approval_histories.push({
      id: dbManager.nextId('approval_histories'),
      risk_id: risk.id,
      user_id: userId,
      action: 'SUBMIT',
      comments: comments || 'Risk assessment submitted for review',
      created_at: new Date().toISOString()
    });

    // Audit log
    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'SUBMIT',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: 'SUBMITTED'
    });

    dbManager.persist();

    // Trigger automated email alert for Moderate, High, Extreme risks (Rule 6 & Section 17)
    await notificationsService.triggerRiskSubmitAlert(risk, { id: userId });

    return this.getRiskById(id)!;
  }

  /**
   * Workflow transition: APPROVE
   * SUBMITTED / UNDER_REVIEW -> APPROVED
   */
  public async approveRisk(id: number, userId: number, comments?: string): Promise<Risk> {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = risks.find(r => r.id === Number(id));
    if (!risk) throw new Error('Risk not found');

    const oldStatus = risk.status;
    risk.status = 'APPROVED';
    risk.updated_at = new Date().toISOString();

    dbManager.getState().approval_histories.push({
      id: dbManager.nextId('approval_histories'),
      risk_id: risk.id,
      user_id: userId,
      action: 'APPROVE',
      comments: comments || 'Risk assessment approved by Risk Management',
      created_at: new Date().toISOString()
    });

    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'APPROVE',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: 'APPROVED'
    });

    dbManager.persist();
    return this.getRiskById(id)!;
  }

  /**
   * Workflow transition: REJECT / RETURN FOR REVISION
   * UNDER_REVIEW / SUBMITTED -> REVISION_REQUIRED
   */
  public async rejectRisk(id: number, userId: number, comments: string): Promise<Risk> {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = risks.find(r => r.id === Number(id));
    if (!risk) throw new Error('Risk not found');

    const oldStatus = risk.status;
    risk.status = 'REVISION_REQUIRED';
    risk.updated_at = new Date().toISOString();

    dbManager.getState().approval_histories.push({
      id: dbManager.nextId('approval_histories'),
      risk_id: risk.id,
      user_id: userId,
      action: 'REVISE',
      comments: comments || 'Returned for revision: Please update controls and mitigation timeline.',
      created_at: new Date().toISOString()
    });

    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'REJECT',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: 'REVISION_REQUIRED'
    });

    dbManager.persist();
    return this.getRiskById(id)!;
  }

  /**
   * Workflow transition: CLOSE
   */
  public async closeRisk(id: number, userId: number, comments?: string): Promise<Risk> {
    const risks = dbManager.getCollection<Risk>('risks');
    const risk = risks.find(r => r.id === Number(id));
    if (!risk) throw new Error('Risk not found');

    const oldStatus = risk.status;
    risk.status = 'CLOSED';
    risk.updated_at = new Date().toISOString();

    dbManager.getState().approval_histories.push({
      id: dbManager.nextId('approval_histories'),
      risk_id: risk.id,
      user_id: userId,
      action: 'CLOSE',
      comments: comments || 'Risk closed after successful control monitoring and mitigation.',
      created_at: new Date().toISOString()
    });

    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'CLOSE',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: 'CLOSED'
    });

    dbManager.persist();
    return this.getRiskById(id)!;
  }

  public deleteRisk(id: number, userId: number) {
    const risks = dbManager.getCollection<Risk>('risks');
    const index = risks.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error('Risk not found');

    const risk = risks[index];
    risks.splice(index, 1);

    auditService.logActivity({
      userId,
      entity: 'Risk',
      entityId: risk.risk_id,
      action: 'DELETE',
      newValue: `Deleted risk ${risk.risk_id}`
    });

    dbManager.persist();
    return { success: true, id };
  }

  /**
   * 5x5 Matrix Generation (Section 6)
   * Calculates dynamic count of risks in each cell from the database
   */
  public getMatrix(type: 'inherent' | 'residual', filterUnitId?: number): MatrixCellSummary[] {
    const risks = dbManager.getCollection<Risk>('risks');
    const filtered = filterUnitId ? risks.filter(r => r.unit_id === Number(filterUnitId)) : risks;

    const matrixCells: MatrixCellSummary[] = [];

    // X: Likelihood (1 to 5)
    // Y: Impact (1 to 5)
    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        const score = l * i;
        const count = filtered.filter(r => {
          if (type === 'inherent') {
            return r.inherent_likelihood === l && r.inherent_impact === i;
          } else {
            return r.residual_likelihood === l && r.residual_impact === i;
          }
        }).length;

        const scoreRes = calculateRiskScore(l, i);

        matrixCells.push({
          likelihood: l,
          impact: i,
          score,
          rating: scoreRes.rating,
          count
        });
      }
    }

    return matrixCells;
  }
}

export const risksService = new RisksService();
