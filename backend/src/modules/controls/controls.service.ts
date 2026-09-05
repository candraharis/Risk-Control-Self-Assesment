import { dbManager } from '../../database/db.ts';
import { Control, EffectivenessLevel, ControlType, ControlFrequency } from '../../../../shared/types.ts';
import { calculateControlEffectiveness } from '../../../../shared/risk-scoring.ts';
import { auditService } from '../audit/audit.service.ts';

export class ControlsService {
  public getControlsByRiskId(riskId: number): Control[] {
    const controls = dbManager.getCollection<Control>('controls');
    const users = dbManager.getCollection('users');

    return controls
      .filter(c => c.risk_id === Number(riskId))
      .map(c => {
        const owner = users.find(u => u.id === c.control_owner_id);
        return {
          ...c,
          control_owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : undefined
        };
      });
  }

  public getAllControls(): Control[] {
    const controls = dbManager.getCollection<Control>('controls');
    const users = dbManager.getCollection('users');

    return controls.map(c => {
      const owner = users.find(u => u.id === c.control_owner_id);
      return {
        ...c,
        control_owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : undefined
      };
    });
  }

  public createControl(data: {
    risk_id: number;
    control_name: string;
    control_description: string;
    control_objective: string;
    control_type: ControlType;
    control_frequency: ControlFrequency;
    control_owner_id: number;
    control_design_effectiveness: EffectivenessLevel;
    control_operating_effectiveness: EffectivenessLevel;
    evidence?: string | null;
    userId?: number;
  }): Control {
    const id = dbManager.nextId('controls');
    const effResult = calculateControlEffectiveness(
      data.control_design_effectiveness,
      data.control_operating_effectiveness
    );

    const controlCount = dbManager.getCollection('controls').length + 1;
    const controlIdCode = `CTL-${controlCount.toString().padStart(3, '0')}`;

    const newControl: Control = {
      id,
      risk_id: Number(data.risk_id),
      control_id: controlIdCode,
      control_name: data.control_name,
      control_description: data.control_description,
      control_objective: data.control_objective,
      control_type: data.control_type,
      control_frequency: data.control_frequency,
      control_owner_id: Number(data.control_owner_id),
      control_design_effectiveness: data.control_design_effectiveness,
      control_operating_effectiveness: data.control_operating_effectiveness,
      control_effectiveness: effResult.level,
      evidence: data.evidence || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbManager.getState().controls.push(newControl);
    dbManager.persist();

    auditService.logActivity({
      userId: data.userId || data.control_owner_id,
      entity: 'Control',
      entityId: controlIdCode,
      action: 'CREATE',
      newValue: `Created control: ${data.control_name} (Risk ID: ${data.risk_id})`
    });

    return newControl;
  }

  public updateControl(id: number, updates: Partial<Control>, userId?: number): Control {
    const controls = dbManager.getCollection<Control>('controls');
    const control = controls.find(c => c.id === Number(id));
    if (!control) {
      throw new Error(`Control with ID ${id} not found`);
    }

    if (updates.control_design_effectiveness || updates.control_operating_effectiveness) {
      const design = updates.control_design_effectiveness || control.control_design_effectiveness;
      const operating = updates.control_operating_effectiveness || control.control_operating_effectiveness;
      const effResult = calculateControlEffectiveness(design, operating);
      updates.control_effectiveness = effResult.level;
    }

    Object.assign(control, updates, { updated_at: new Date().toISOString() });
    dbManager.persist();

    auditService.logActivity({
      userId: userId || null,
      entity: 'Control',
      entityId: control.control_id,
      action: 'UPDATE',
      newValue: `Updated control ${control.control_id}`
    });

    return control;
  }
}

export const controlsService = new ControlsService();
