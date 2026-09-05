import { dbManager } from '../../database/db.ts';
import { Risk, ActionPlan, Control, DashboardSummary, RiskRating } from '../../../../shared/types.ts';
import { risksService } from '../risks/risks.service.ts';

export class DashboardService {
  public getDashboardSummary(unitId?: number): DashboardSummary {
    let risks = dbManager.getCollection<Risk>('risks');
    let plans = dbManager.getCollection<ActionPlan>('action_plans');
    let controls = dbManager.getCollection<Control>('controls');
    const units = dbManager.getCollection('units');
    const categories = dbManager.getCollection('risk_categories');

    if (unitId) {
      risks = risks.filter(r => r.unit_id === Number(unitId));
      const riskIds = new Set(risks.map(r => r.id));
      plans = plans.filter(p => riskIds.has(p.risk_id));
      controls = controls.filter(c => riskIds.has(c.risk_id));
    }

    // 1. Inherent vs Residual Distribution
    const inherentCounts: Record<RiskRating, number> = { LOW: 0, MODERATE: 0, HIGH: 0, EXTREME: 0 };
    const residualCounts: Record<RiskRating, number> = { LOW: 0, MODERATE: 0, HIGH: 0, EXTREME: 0 };

    risks.forEach(r => {
      inherentCounts[r.inherent_rating] = (inherentCounts[r.inherent_rating] || 0) + 1;
      residualCounts[r.residual_rating] = (residualCounts[r.residual_rating] || 0) + 1;
    });

    // 2. Action Plan Status Counts
    let notStartedPlans = 0;
    let inProgressPlans = 0;
    let completedPlans = 0;
    let overduePlans = 0;

    plans.forEach(p => {
      if (p.status === 'COMPLETED') completedPlans++;
      else if (p.status === 'OVERDUE') overduePlans++;
      else if (p.status === 'IN_PROGRESS') inProgressPlans++;
      else notStartedPlans++;
    });

    // 3. Top 10 High & Extreme Risks
    const topRisks = [...risks]
      .sort((a, b) => b.inherent_score - a.inherent_score || b.residual_score - a.residual_score)
      .slice(0, 10)
      .map(r => {
        const u = units.find(unit => unit.id === r.unit_id);
        const c = categories.find(cat => cat.id === r.risk_category_id);
        return {
          id: r.id,
          risk_id: r.risk_id,
          risk_event: r.risk_event,
          unit_name: u ? u.name : 'Unit',
          category_name: c ? c.name : 'Category',
          inherent_score: r.inherent_score,
          inherent_rating: r.inherent_rating,
          residual_score: r.residual_score,
          residual_rating: r.residual_rating,
          status: r.status
        };
      });

    // 4. Distribution by Category
    const byCategory = categories.map(cat => {
      const count = risks.filter(r => r.risk_category_id === cat.id).length;
      return {
        category_id: cat.id,
        category_name: cat.name,
        count
      };
    }).filter(c => c.count > 0);

    // 5. Distribution by Unit
    const byUnit = units.map(u => {
      const unitRisks = risks.filter(r => r.unit_id === u.id);
      return {
        unit_id: u.id,
        unit_code: u.code,
        unit_name: u.name,
        count: unitRisks.length,
        high_extreme_count: unitRisks.filter(r => r.inherent_rating === 'HIGH' || r.inherent_rating === 'EXTREME').length
      };
    });

    // 6. Control Effectiveness Distribution
    const controlEffectiveness = {
      EFFECTIVE: controls.filter(c => c.control_effectiveness === 'EFFECTIVE').length,
      PARTIALLY_EFFECTIVE: controls.filter(c => c.control_effectiveness === 'PARTIALLY_EFFECTIVE').length,
      INEFFECTIVE: controls.filter(c => c.control_effectiveness === 'INEFFECTIVE').length
    };

    // 7. Matrices
    const inherentMatrix = risksService.getMatrix('inherent', unitId);
    const residualMatrix = risksService.getMatrix('residual', unitId);

    return {
      total_risks: risks.length,
      inherent_distribution: inherentCounts,
      residual_distribution: residualCounts,
      action_plans_metrics: {
        total: plans.length,
        not_started: notStartedPlans,
        in_progress: inProgressPlans,
        completed: completedPlans,
        overdue: overduePlans
      },
      top_risks: topRisks,
      distribution_by_category: byCategory,
      distribution_by_unit: byUnit,
      control_effectiveness_summary: controlEffectiveness,
      inherent_matrix: inherentMatrix,
      residual_matrix: residualMatrix
    };
  }
}

export const dashboardService = new DashboardService();
