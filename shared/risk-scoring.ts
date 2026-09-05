import {
  RiskRating,
  EffectivenessLevel,
  ActionPlanStatus,
  NotificationType
} from './types.ts';

export interface RiskScoreResult {
  score: number;
  rating: RiskRating;
  level: number;
  color: string;
  badgeClass: string;
}

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain'
};

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Insignificant',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Severe'
};

export const RATING_COLORS: Record<RiskRating, { text: string; bg: string; border: string; hex: string }> = {
  LOW: {
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    hex: '#10b981'
  },
  MODERATE: {
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    hex: '#f59e0b'
  },
  HIGH: {
    text: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    hex: '#f97316'
  },
  EXTREME: {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    hex: '#ef4444'
  }
};

/**
 * Centrally calculates risk rating from score
 * 1-4 = LOW
 * 5-9 = MODERATE
 * 10-16 = HIGH
 * 17-25 = EXTREME
 */
export function calculateRiskRating(score: number): RiskRating {
  if (score <= 4) return 'LOW';
  if (score <= 9) return 'MODERATE';
  if (score <= 16) return 'HIGH';
  return 'EXTREME';
}

/**
 * Formula: Risk Score = Likelihood × Impact
 */
export function calculateRiskScore(likelihood: number, impact: number): RiskScoreResult {
  const clampedLikelihood = Math.min(5, Math.max(1, Math.round(likelihood)));
  const clampedImpact = Math.min(5, Math.max(1, Math.round(impact)));
  const score = clampedLikelihood * clampedImpact;
  const rating = calculateRiskRating(score);

  const levelMap: Record<RiskRating, number> = {
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    EXTREME: 4
  };

  return {
    score,
    rating,
    level: levelMap[rating],
    color: RATING_COLORS[rating].hex,
    badgeClass: `${RATING_COLORS[rating].bg} ${RATING_COLORS[rating].text} ${RATING_COLORS[rating].border} border`
  };
}

/**
 * Control Effectiveness Engine:
 * Effective = 3
 * Partially Effective = 2
 * Ineffective = 1
 *
 * Control Effectiveness Score = average(Design Effectiveness, Operating Effectiveness)
 * 2.5 – 3.0 = Effective
 * 1.5 – 2.49 = Partially Effective
 * 1.0 – 1.49 = Ineffective
 */
export function calculateControlEffectiveness(
  designEffectiveness: EffectivenessLevel,
  operatingEffectiveness: EffectivenessLevel
): { score: number; level: EffectivenessLevel } {
  const valueMap: Record<EffectivenessLevel, number> = {
    EFFECTIVE: 3,
    PARTIALLY_EFFECTIVE: 2,
    INEFFECTIVE: 1
  };

  const dVal = valueMap[designEffectiveness] || 1;
  const oVal = valueMap[operatingEffectiveness] || 1;
  const avg = (dVal + oVal) / 2;

  let level: EffectivenessLevel = 'INEFFECTIVE';
  if (avg >= 2.5) {
    level = 'EFFECTIVE';
  } else if (avg >= 1.5) {
    level = 'PARTIALLY_EFFECTIVE';
  } else {
    level = 'INEFFECTIVE';
  }

  return {
    score: Number(avg.toFixed(2)),
    level
  };
}

/**
 * Residual Risk Validation Rule:
 * Residual Score cannot exceed Inherent Score without justification.
 */
export function validateResidualRisk(
  inherentScore: number,
  residualScore: number,
  justification?: string | null
): { valid: boolean; warning?: string; requiresJustification: boolean } {
  if (residualScore > inherentScore) {
    const hasJustification = !!justification && justification.trim().length >= 10;
    return {
      valid: hasJustification,
      requiresJustification: true,
      warning: 'Residual risk cannot exceed inherent risk without documented justification.'
    };
  }
  return { valid: true, requiresJustification: false };
}

/**
 * Overdue detection rule:
 * If target_date < current_date && status != COMPLETED -> OVERDUE
 */
export function overdueDetection(targetDateStr: string | Date, currentStatus: ActionPlanStatus): boolean {
  if (currentStatus === 'COMPLETED') {
    return false;
  }
  const targetDate = new Date(targetDateStr);
  const now = new Date();
  // Normalize to date-only comparison in UTC/local
  targetDate.setHours(23, 59, 59, 999);
  return targetDate.getTime() < now.getTime();
}

/**
 * Helper to determine difference in calendar days between two dates
 */
export function getDaysDifference(targetDateStr: string | Date, referenceDate: Date = new Date()): number {
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Reminder Eligibility Engine:
 * H-7 (7 days before due date)
 * H-3 (3 days before)
 * H-1 (1 day before)
 * Due Date (0 days)
 * Post Due Date (overdue): every 3 days (H+3, H+6, H+9, etc.)
 * Escalation:
 * Overdue > 7 days -> ESCALATION_7D
 * Overdue > 14 days -> ESCALATION_14D
 */
export function reminderEligibility(
  targetDateStr: string | Date,
  status: ActionPlanStatus,
  referenceDate: Date = new Date()
): NotificationType | null {
  if (status === 'COMPLETED') {
    return null;
  }

  const daysDiff = getDaysDifference(targetDateStr, referenceDate);

  if (daysDiff === 7) return 'ACTION_PLAN_H7';
  if (daysDiff === 3) return 'ACTION_PLAN_H3';
  if (daysDiff === 1) return 'ACTION_PLAN_H1';
  if (daysDiff === 0) return 'ACTION_PLAN_DUE';

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);

    // Escalations trigger on exactly 14 or 7 days, or reminders every 3 days
    if (overdueDays === 14) return 'ESCALATION_14D';
    if (overdueDays === 7) return 'ESCALATION_7D';
    if (overdueDays % 3 === 0) return 'ACTION_PLAN_OVERDUE';
  }

  return null;
}

/**
 * Email Deduplication Key (Idempotency Key)
 * risk_id + action_plan_id + notification_type + notification_date
 */
export function emailDeduplication(
  riskId: number | string | null,
  actionPlanId: number | string | null,
  notificationType: NotificationType,
  date: Date = new Date()
): string {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${riskId || '0'}_${actionPlanId || '0'}_${notificationType}_${dateStr}`;
}
