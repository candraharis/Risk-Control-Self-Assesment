import { dbManager } from '../../database/db.ts';
import { risksService } from '../risks/risks.service.ts';
import { Risk } from '../../../../shared/types.ts';

export class ReportsService {
  /**
   * Generates CSV format Risk Register export
   */
  public generateRiskRegisterCsv(unitId?: number): string {
    const risks = risksService.getAllRisks(unitId ? { unit_id: unitId } : undefined);

    const headers = [
      'Risk ID',
      'Work Unit',
      'Category',
      'Risk Owner',
      'Business Process',
      'Sub Process',
      'Risk Event',
      'Risk Description',
      'Root Cause',
      'Impact Description',
      'Inherent Likelihood',
      'Inherent Impact',
      'Inherent Score',
      'Inherent Rating',
      'Residual Likelihood',
      'Residual Impact',
      'Residual Score',
      'Residual Rating',
      'Risk Response',
      'Status',
      'Created Date'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = risks.map(r => [
      escapeCsv(r.risk_id),
      escapeCsv(r.unit ? r.unit.name : ''),
      escapeCsv(r.risk_category ? r.risk_category.name : ''),
      escapeCsv(r.risk_owner ? r.risk_owner.name : ''),
      escapeCsv(r.business_process),
      escapeCsv(r.sub_process),
      escapeCsv(r.risk_event),
      escapeCsv(r.risk_description),
      escapeCsv(r.risk_cause),
      escapeCsv(r.risk_impact_description),
      escapeCsv(r.inherent_likelihood),
      escapeCsv(r.inherent_impact),
      escapeCsv(r.inherent_score),
      escapeCsv(r.inherent_rating),
      escapeCsv(r.residual_likelihood),
      escapeCsv(r.residual_impact),
      escapeCsv(r.residual_score),
      escapeCsv(r.residual_rating),
      escapeCsv(r.risk_response),
      escapeCsv(r.status),
      escapeCsv(new Date(r.created_at).toLocaleDateString())
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  }

  /**
   * Generates Action Plans Monitoring CSV export
   */
  public generateActionPlansCsv(unitId?: number): string {
    const risks = dbManager.getCollection<Risk>('risks');
    const plans = dbManager.getCollection('action_plans');
    const users = dbManager.getCollection('users');
    const units = dbManager.getCollection('units');

    const headers = [
      'Plan ID',
      'Risk ID',
      'Work Unit',
      'Risk Event',
      'Mitigation Action Plan',
      'PIC',
      'Priority',
      'Target Date',
      'Progress (%)',
      'Status',
      'Completion Date',
      'Remarks'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = plans.map((p: any) => {
      const risk = risks.find(r => r.id === p.risk_id);
      const unit = risk ? units.find(u => u.id === risk.unit_id) : null;
      const pic = users.find(u => u.id === p.pic_id);

      if (unitId && risk && risk.unit_id !== Number(unitId)) {
        return null;
      }

      return [
        escapeCsv(`AP-${p.id}`),
        escapeCsv(risk ? risk.risk_id : ''),
        escapeCsv(unit ? unit.name : ''),
        escapeCsv(risk ? risk.risk_event : ''),
        escapeCsv(p.action_plan),
        escapeCsv(pic ? pic.name : ''),
        escapeCsv(p.priority),
        escapeCsv(new Date(p.target_date).toLocaleDateString()),
        escapeCsv(`${p.progress}%`),
        escapeCsv(p.status),
        escapeCsv(p.completion_date ? new Date(p.completion_date).toLocaleDateString() : '-'),
        escapeCsv(p.remarks || '')
      ];
    }).filter(Boolean);

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\r\n');
  }
}

export const reportsService = new ReportsService();
