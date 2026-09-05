import {
  calculateRiskScore,
  calculateRiskRating,
  calculateControlEffectiveness,
  validateResidualRisk,
  overdueDetection,
  reminderEligibility,
  emailDeduplication
} from '../shared/risk-scoring.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    failed++;
  }
}

console.log('--- RUNNING RISK SCORING ENGINE UNIT TESTS ---');

// 1. calculateRiskRating() tests
assert(calculateRiskRating(1) === 'LOW', 'Rating for score 1 is LOW');
assert(calculateRiskRating(4) === 'LOW', 'Rating for score 4 is LOW');
assert(calculateRiskRating(5) === 'MODERATE', 'Rating for score 5 is MODERATE');
assert(calculateRiskRating(9) === 'MODERATE', 'Rating for score 9 is MODERATE');
assert(calculateRiskRating(10) === 'HIGH', 'Rating for score 10 is HIGH');
assert(calculateRiskRating(16) === 'HIGH', 'Rating for score 16 is HIGH');
assert(calculateRiskRating(17) === 'EXTREME', 'Rating for score 17 is EXTREME');
assert(calculateRiskRating(20) === 'EXTREME', 'Rating for score 20 is EXTREME');
assert(calculateRiskRating(25) === 'EXTREME', 'Rating for score 25 is EXTREME');

// 2. calculateRiskScore() tests
const res1 = calculateRiskScore(4, 5);
assert(res1.score === 20, 'Score for 4x5 is 20');
assert(res1.rating === 'EXTREME', 'Rating for 4x5 is EXTREME');
assert(res1.level === 4, 'Level for EXTREME is 4');

const res2 = calculateRiskScore(2, 2);
assert(res2.score === 4, 'Score for 2x2 is 4');
assert(res2.rating === 'LOW', 'Rating for 2x2 is LOW');

const res3 = calculateRiskScore(3, 3);
assert(res3.score === 9, 'Score for 3x3 is 9');
assert(res3.rating === 'MODERATE', 'Rating for 3x3 is MODERATE');

const res4 = calculateRiskScore(3, 4);
assert(res4.score === 12, 'Score for 3x4 is 12');
assert(res4.rating === 'HIGH', 'Rating for 3x4 is HIGH');

// 3. calculateControlEffectiveness() tests
// Effective (3) + Effective (3) = avg 3.0 -> EFFECTIVE
const eff1 = calculateControlEffectiveness('EFFECTIVE', 'EFFECTIVE');
assert(eff1.score === 3.0 && eff1.level === 'EFFECTIVE', 'Effective + Effective = 3.0 Effective');

// Effective (3) + Partially Effective (2) = avg 2.5 -> EFFECTIVE
const eff2 = calculateControlEffectiveness('EFFECTIVE', 'PARTIALLY_EFFECTIVE');
assert(eff2.score === 2.5 && eff2.level === 'EFFECTIVE', 'Effective + Partially Effective = 2.5 Effective');

// Partially Effective (2) + Ineffective (1) = avg 1.5 -> PARTIALLY_EFFECTIVE
const eff3 = calculateControlEffectiveness('PARTIALLY_EFFECTIVE', 'INEFFECTIVE');
assert(eff3.score === 1.5 && eff3.level === 'PARTIALLY_EFFECTIVE', 'Partially + Ineffective = 1.5 Partially Effective');

// Ineffective (1) + Ineffective (1) = avg 1.0 -> INEFFECTIVE
const eff4 = calculateControlEffectiveness('INEFFECTIVE', 'INEFFECTIVE');
assert(eff4.score === 1.0 && eff4.level === 'INEFFECTIVE', 'Ineffective + Ineffective = 1.0 Ineffective');

// 4. validateResidualRisk() tests
// Residual (9) <= Inherent (20) -> valid without justification
const val1 = validateResidualRisk(20, 9);
assert(val1.valid === true && !val1.requiresJustification, 'Residual <= Inherent is valid without justification');

// Residual (20) > Inherent (16) without justification -> invalid
const val2 = validateResidualRisk(16, 20, '');
assert(val2.valid === false && val2.requiresJustification === true, 'Residual > Inherent without justification is invalid');

// Residual (20) > Inherent (16) with justification -> valid
const val3 = validateResidualRisk(16, 20, 'Higher residual risk due to regulatory timeline postponement');
assert(val3.valid === true, 'Residual > Inherent with valid justification is approved');

// 5. overdueDetection() tests
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 3);
assert(overdueDetection(pastDate, 'IN_PROGRESS') === true, 'Past target date with IN_PROGRESS is overdue');
assert(overdueDetection(pastDate, 'COMPLETED') === false, 'Completed action plan is never overdue');

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 5);
assert(overdueDetection(futureDate, 'IN_PROGRESS') === false, 'Future target date is not overdue');

// 6. reminderEligibility() tests
const today = new Date();
const targetH7 = new Date(today);
targetH7.setDate(today.getDate() + 7);
assert(reminderEligibility(targetH7, 'IN_PROGRESS', today) === 'ACTION_PLAN_H7', '7 days prior triggers ACTION_PLAN_H7');

const targetH3 = new Date(today);
targetH3.setDate(today.getDate() + 3);
assert(reminderEligibility(targetH3, 'IN_PROGRESS', today) === 'ACTION_PLAN_H3', '3 days prior triggers ACTION_PLAN_H3');

const targetH1 = new Date(today);
targetH1.setDate(today.getDate() + 1);
assert(reminderEligibility(targetH1, 'IN_PROGRESS', today) === 'ACTION_PLAN_H1', '1 day prior triggers ACTION_PLAN_H1');

const targetDue = new Date(today);
assert(reminderEligibility(targetDue, 'IN_PROGRESS', today) === 'ACTION_PLAN_DUE', 'Due date triggers ACTION_PLAN_DUE');

const targetOverdue7 = new Date(today);
targetOverdue7.setDate(today.getDate() - 7);
assert(reminderEligibility(targetOverdue7, 'IN_PROGRESS', today) === 'ESCALATION_7D', 'Overdue 7 days triggers ESCALATION_7D');

const targetOverdue14 = new Date(today);
targetOverdue14.setDate(today.getDate() - 14);
assert(reminderEligibility(targetOverdue14, 'IN_PROGRESS', today) === 'ESCALATION_14D', 'Overdue 14 days triggers ESCALATION_14D');

const targetOverdue3 = new Date(today);
targetOverdue3.setDate(today.getDate() - 3);
assert(reminderEligibility(targetOverdue3, 'IN_PROGRESS', today) === 'ACTION_PLAN_OVERDUE', 'Overdue 3 days triggers ACTION_PLAN_OVERDUE');

// 7. emailDeduplication() tests
const key1 = emailDeduplication(101, 202, 'ACTION_PLAN_H7', new Date('2026-09-04'));
assert(key1 === '101_202_ACTION_PLAN_H7_2026-09-04', 'Idempotency key formats correctly');

console.log(`\nUnit Tests Completed: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) {
  process.exit(1);
}
