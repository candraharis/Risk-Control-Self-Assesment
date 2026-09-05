import { dbManager } from '../../database/db.ts';
import { AuditLog } from '../../../../shared/types.ts';

export class AuditRepository {
  public getAll(filters?: { entity?: string; action?: string; limit?: number }): AuditLog[] {
    let logs = [...dbManager.getCollection<AuditLog>('audit_logs')];
    
    // Sort descending by created_at
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.entity) {
      logs = logs.filter(l => l.entity.toLowerCase() === filters.entity?.toLowerCase());
    }
    if (filters?.action) {
      logs = logs.filter(l => l.action.toLowerCase() === filters.action?.toLowerCase());
    }
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    // Attach user details
    const users = dbManager.getCollection('users');
    return logs.map(log => {
      const user = users.find(u => u.id === log.user_id);
      return {
        ...log,
        user: user ? { id: user.id, name: user.name, email: user.email } : null
      };
    });
  }

  public create(logData: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const id = dbManager.nextId('audit_logs');
    const newLog: AuditLog = {
      id,
      ...logData,
      created_at: new Date().toISOString()
    };
    dbManager.getState().audit_logs.push(newLog);
    dbManager.persist();
    return newLog;
  }
}

export class AuditService {
  private repo = new AuditRepository();

  public getLogs(filters?: { entity?: string; action?: string; limit?: number }) {
    return this.repo.getAll(filters);
  }

  public logActivity(params: {
    userId?: number | null;
    entity: string;
    entityId: string;
    action: string;
    fieldName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return this.repo.create({
      user_id: params.userId || null,
      entity: params.entity,
      entity_id: params.entityId,
      action: params.action,
      field_name: params.fieldName || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null
    });
  }
}

export const auditService = new AuditService();
