import {
  Risk,
  Control,
  ActionPlan,
  DashboardSummary,
  NotificationLog,
  AuditLog,
  MatrixCellSummary,
  RiskCategory,
  Unit,
  Role
} from '../../shared/types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('rcsa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options?.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password?: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getMe: () => request<any>('/auth/me'),

  // Master Data
  getUnits: () => request<Unit[]>('/units'),
  getCategories: () => request<RiskCategory[]>('/categories'),
  getRoles: () => request<Role[]>('/roles'),
  getUsers: () => request<any[]>('/users'),

  // Dashboard
  getDashboardSummary: (unitId?: number) => {
    const query = unitId ? `?unit_id=${unitId}` : '';
    return request<DashboardSummary>(`/dashboard/summary${query}`);
  },

  // Risks
  getRisks: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Risk[]>(`/risks${query}`);
  },
  getRiskById: (id: number | string) => request<Risk>(`/risks/${id}`),
  createRisk: (data: any) =>
    request<Risk>('/risks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateRisk: (id: number, data: any) =>
    request<Risk>(`/risks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteRisk: (id: number) =>
    request<{ success: boolean; id: number }>(`/risks/${id}`, {
      method: 'DELETE'
    }),

  // Risk Workflow Transitions
  submitRisk: (id: number, comments?: string) =>
    request<Risk>(`/risks/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  approveRisk: (id: number, comments?: string) =>
    request<Risk>(`/risks/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  rejectRisk: (id: number, comments: string) =>
    request<Risk>(`/risks/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  closeRisk: (id: number, comments?: string) =>
    request<Risk>(`/risks/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),

  // 5x5 Matrices
  getInherentMatrix: (unitId?: number) => {
    const query = unitId ? `?unit_id=${unitId}` : '';
    return request<MatrixCellSummary[]>(`/risks/matrix/inherent${query}`);
  },
  getResidualMatrix: (unitId?: number) => {
    const query = unitId ? `?unit_id=${unitId}` : '';
    return request<MatrixCellSummary[]>(`/risks/matrix/residual${query}`);
  },

  // Controls
  getControls: (riskId?: number) => {
    const query = riskId ? `?risk_id=${riskId}` : '';
    return request<Control[]>(`/controls${query}`);
  },
  createControl: (data: any) =>
    request<Control>('/controls', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateControl: (id: number, data: any) =>
    request<Control>(`/controls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Action Plans
  getActionPlans: (params?: { risk_id?: number; status?: string; pic_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<ActionPlan[]>(`/action-plans${query}`);
  },
  createActionPlan: (data: any) =>
    request<ActionPlan>('/action-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateActionPlan: (id: number, data: any) =>
    request<ActionPlan>(`/action-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Notifications
  getNotifications: (params?: { status?: string; notification_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) searchParams.append(key, val);
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<NotificationLog[]>(`/notifications${query}`);
  },
  sendTestEmail: (email: string, name?: string) =>
    request<any>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    }),

  // Scheduler
  runScheduler: () =>
    request<{ message: string; overdueUpdated: number; remindersSent: number; escalationsSent: number; details: string[] }>(
      '/scheduler/run',
      { method: 'POST' }
    ),

  // Audit Logs
  getAuditLogs: (params?: { entity?: string; action?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined) searchParams.append(key, String(val));
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<AuditLog[]>(`/audit-logs${query}`);
  },

  // Reset Seed
  resetSeed: () => request<any>('/system/reset-seed', { method: 'POST' })
};
