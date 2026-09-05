export type RoleName = 'ADMIN' | 'RISK_MANAGEMENT' | 'RISK_OWNER' | 'MANAGEMENT' | 'AUDITOR';

export type RiskRating = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export type RiskResponse = 'ACCEPT' | 'REDUCE' | 'TRANSFER' | 'AVOID';

export type RiskStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'REVISION_REQUIRED' 
  | 'APPROVED' 
  | 'MONITORING' 
  | 'CLOSED';

export type ControlType = 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';

export type ControlFrequency = 
  | 'CONTINUOUS' 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'ANNUALLY';

export type EffectivenessLevel = 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';

export type ActionPlanPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionPlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export type NotificationType = 
  | 'RISK_CREATED' 
  | 'RISK_HIGH_ALERT' 
  | 'ACTION_PLAN_H7' 
  | 'ACTION_PLAN_H3' 
  | 'ACTION_PLAN_H1' 
  | 'ACTION_PLAN_DUE' 
  | 'ACTION_PLAN_OVERDUE' 
  | 'ESCALATION_7D' 
  | 'ESCALATION_14D';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role_id: number;
  role?: { id: number; name: RoleName; description?: string };
  unit_id?: number | null;
  unit?: { id: number; code: string; name: string } | null;
  manager_id?: number | null;
  manager?: { id: number; name: string; email: string } | null;
  is_active: boolean;
  created_at?: string;
}

export interface Unit {
  id: number;
  code: string;
  name: string;
  parent_unit_id?: number | null;
  is_active: boolean;
}

export interface RiskCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Control {
  id: number;
  risk_id: number;
  control_id: string;
  control_name: string;
  control_description: string;
  control_objective: string;
  control_type: ControlType;
  control_frequency: ControlFrequency;
  control_owner_id: number;
  control_owner?: { id: number; name: string; email: string };
  control_effectiveness: EffectivenessLevel;
  control_design_effectiveness: EffectivenessLevel;
  control_operating_effectiveness: EffectivenessLevel;
  evidence?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActionPlan {
  id: number;
  risk_id: number;
  action_plan: string;
  pic_id: number;
  pic?: { id: number; name: string; email: string };
  priority: ActionPlanPriority;
  target_date: string;
  progress: number;
  status: ActionPlanStatus;
  completion_date?: string | null;
  evidence?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalHistory {
  id: number;
  risk_id: number;
  user_id: number;
  user?: { id: number; name: string; email: string; role?: { name: RoleName } };
  action: string;
  comments?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null;
  entity: string;
  entity_id: string;
  action: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  risk_id?: number | null;
  risk_ref?: { risk_id: string; risk_event: string };
  action_plan_id?: number | null;
  recipient_id: number;
  recipient_email: string;
  recipient_name?: string;
  notification_type: NotificationType;
  subject: string;
  body?: string;
  sent_at?: string | null;
  status: NotificationStatus;
  error_message?: string | null;
  notification_date: string;
  created_at: string;
}

export interface Risk {
  id: number;
  risk_id: string;
  unit_id: number;
  unit?: Unit;
  risk_owner_id: number;
  risk_owner?: User;
  risk_category_id: number;
  risk_category?: RiskCategory;
  business_process: string;
  sub_process: string;
  risk_event: string;
  risk_description: string;
  risk_cause: string;
  risk_impact_description: string;

  // Inherent
  inherent_likelihood: number;
  inherent_impact: number;
  inherent_score: number;
  inherent_rating: RiskRating;

  // Residual
  residual_likelihood: number;
  residual_impact: number;
  residual_score: number;
  residual_rating: RiskRating;
  residual_justification?: string | null;

  risk_response: RiskResponse;
  risk_response_justification?: string | null;
  status: RiskStatus;

  created_by: number;
  creator?: User;
  created_at: string;
  updated_at: string;

  controls?: Control[];
  action_plans?: ActionPlan[];
  approval_histories?: ApprovalHistory[];
}

export interface MatrixCellSummary {
  likelihood: number;
  impact: number;
  score: number;
  rating: RiskRating;
  count: number;
}

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface DashboardSummary {
  total_risks: number;
  inherent_distribution: Record<RiskRating, number>;
  residual_distribution: Record<RiskRating, number>;
  inherent_matrix: MatrixCellSummary[];
  residual_matrix: MatrixCellSummary[];
  distribution_by_category: { category_id: number; category_name: string; count: number }[];
  distribution_by_unit: { unit_id: number; unit_name: string; count: number }[];
  control_effectiveness_summary: Record<EffectivenessLevel, number>;
  action_plans_metrics: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  top_risks: {
    id: number;
    risk_id: string;
    risk_event: string;
    unit_name: string;
    category_name: string;
    inherent_score: number;
    inherent_rating: RiskRating;
    residual_score: number;
    residual_rating: RiskRating;
    status: RiskStatus;
  }[];
}
