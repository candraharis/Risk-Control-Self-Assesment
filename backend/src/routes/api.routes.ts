import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.ts';
import { authService } from '../modules/auth/auth.service.ts';
import { usersService } from '../modules/users/users.service.ts';
import { unitsService } from '../modules/units/units.service.ts';
import { risksService } from '../modules/risks/risks.service.ts';
import { controlsService } from '../modules/controls/controls.service.ts';
import { actionPlansService } from '../modules/action-plans/action-plans.service.ts';
import { notificationsService } from '../modules/notifications/notifications.service.ts';
import { dashboardService } from '../modules/dashboard/dashboard.service.ts';
import { reportsService } from '../modules/reports/reports.service.ts';
import { auditService } from '../modules/audit/audit.service.ts';
import { schedulerService } from '../services/scheduler/scheduler.service.ts';
import { dbManager } from '../database/db.ts';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

router.get('/auth/me', authenticate, (req: AuthRequest, res) => {
  try {
    const user = authService.getMe(req.user!.id);
    res.json(user);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ==========================================
// 2. DASHBOARD
// ==========================================
router.get('/dashboard/summary', (req, res) => {
  try {
    const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
    const summary = dashboardService.getDashboardSummary(unitId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. MASTER DATA (Units, Categories, Roles)
// ==========================================
router.get('/units', (req, res) => {
  res.json(unitsService.getAllUnits());
});

router.get('/categories', (req, res) => {
  res.json(unitsService.getAllCategories());
});

router.get('/roles', (req, res) => {
  res.json(unitsService.getAllRoles());
});

// ==========================================
// 4. USERS
// ==========================================
router.get('/users', (req, res) => {
  res.json(usersService.getAllUsers());
});

router.post('/users', authenticate, authorize('ADMIN'), (req: AuthRequest, res) => {
  try {
    const newUser = usersService.createUser({
      ...req.body,
      creatorUserId: req.user!.id
    });
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. RISKS & 5x5 MATRICES
// ==========================================
router.get('/risks/matrix/inherent', (req, res) => {
  const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
  res.json(risksService.getMatrix('inherent', unitId));
});

router.get('/risks/matrix/residual', (req, res) => {
  const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
  res.json(risksService.getMatrix('residual', unitId));
});

router.get('/risks', (req, res) => {
  try {
    const filters = {
      unit_id: req.query.unit_id ? Number(req.query.unit_id) : undefined,
      risk_category_id: req.query.risk_category_id ? Number(req.query.risk_category_id) : undefined,
      risk_owner_id: req.query.risk_owner_id ? Number(req.query.risk_owner_id) : undefined,
      inherent_rating: req.query.inherent_rating as string,
      residual_rating: req.query.residual_rating as string,
      status: req.query.status as string,
      search: req.query.search as string,
      inherent_likelihood: req.query.inherent_likelihood ? Number(req.query.inherent_likelihood) : undefined,
      inherent_impact: req.query.inherent_impact ? Number(req.query.inherent_impact) : undefined,
      residual_likelihood: req.query.residual_likelihood ? Number(req.query.residual_likelihood) : undefined,
      residual_impact: req.query.residual_impact ? Number(req.query.residual_impact) : undefined
    };
    const risks = risksService.getAllRisks(filters);
    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/risks/:id', (req, res) => {
  try {
    const risk = risksService.getRiskById(req.params.id);
    if (!risk) {
      return res.status(404).json({ error: 'Risk assessment not found' });
    }
    res.json(risk);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/risks', authenticate, async (req: AuthRequest, res) => {
  try {
    const creatorUserId = req.user!.id;
    const newRisk = await risksService.createRisk(req.body, creatorUserId);
    res.status(201).json(newRisk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/risks/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const updated = await risksService.updateRisk(Number(req.params.id), req.body, req.user!.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/risks/:id', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), (req: AuthRequest, res) => {
  try {
    const result = risksService.deleteRisk(Number(req.params.id), req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Risk Workflow Transitions
router.post('/risks/:id/submit', authenticate, async (req: AuthRequest, res) => {
  try {
    const risk = await risksService.submitRisk(Number(req.params.id), req.user!.id, req.body.comments);
    res.json(risk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/risks/:id/approve', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), async (req: AuthRequest, res) => {
  try {
    const risk = await risksService.approveRisk(Number(req.params.id), req.user!.id, req.body.comments);
    res.json(risk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/risks/:id/reject', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), async (req: AuthRequest, res) => {
  try {
    const risk = await risksService.rejectRisk(Number(req.params.id), req.user!.id, req.body.comments);
    res.json(risk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/risks/:id/close', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), async (req: AuthRequest, res) => {
  try {
    const risk = await risksService.closeRisk(Number(req.params.id), req.user!.id, req.body.comments);
    res.json(risk);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. CONTROLS
// ==========================================
router.get('/controls', (req, res) => {
  if (req.query.risk_id) {
    res.json(controlsService.getControlsByRiskId(Number(req.query.risk_id)));
  } else {
    res.json(controlsService.getAllControls());
  }
});

router.post('/controls', authenticate, (req: AuthRequest, res) => {
  try {
    const control = controlsService.createControl({
      ...req.body,
      userId: req.user!.id
    });
    res.status(201).json(control);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/controls/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const control = controlsService.updateControl(Number(req.params.id), req.body, req.user!.id);
    res.json(control);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. ACTION PLANS
// ==========================================
router.get('/action-plans', (req, res) => {
  const filters = {
    risk_id: req.query.risk_id ? Number(req.query.risk_id) : undefined,
    status: req.query.status as string,
    pic_id: req.query.pic_id ? Number(req.query.pic_id) : undefined
  };
  res.json(actionPlansService.getAllActionPlans(filters));
});

router.post('/action-plans', authenticate, (req: AuthRequest, res) => {
  try {
    const plan = actionPlansService.createActionPlan({
      ...req.body,
      userId: req.user!.id
    });
    res.status(201).json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/action-plans/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const plan = actionPlansService.updateActionPlan(Number(req.params.id), req.body, req.user!.id);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. NOTIFICATIONS & EMAIL
// ==========================================
router.get('/notifications', (req, res) => {
  const filters = {
    status: req.query.status as string,
    notification_type: req.query.notification_type as string
  };
  res.json(notificationsService.getAllNotifications(filters));
});

router.post('/notifications/test', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Target email is required' });
    const result = await notificationsService.sendTestEmail(email, name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SCHEDULER (Daily Overdue & Reminders)
// ==========================================
router.post('/scheduler/run', authenticate, authorize('ADMIN', 'RISK_MANAGEMENT'), async (req, res) => {
  try {
    const result = await schedulerService.runDailyJobs();
    res.json({ message: 'Daily scheduler scan completed successfully', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. REPORTS & EXPORTS
// ==========================================
router.get('/reports/risk-register/csv', (req, res) => {
  const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
  const csv = reportsService.generateRiskRegisterCsv(unitId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="RCSA-Risk-Register-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

router.get('/reports/action-plans/csv', (req, res) => {
  const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;
  const csv = reportsService.generateActionPlansCsv(unitId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="RCSA-Action-Plans-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// ==========================================
// 11. AUDIT TRAIL
// ==========================================
router.get('/audit-logs', (req, res) => {
  const filters = {
    entity: req.query.entity as string,
    action: req.query.action as string,
    limit: req.query.limit ? Number(req.query.limit) : 100
  };
  res.json(auditService.getLogs(filters));
});

// ==========================================
// 12. SYSTEM ADMIN & RESET
// ==========================================
router.post('/system/reset-seed', authenticate, authorize('ADMIN'), (req, res) => {
  const newState = dbManager.resetToSeed();
  res.json({ message: 'Database successfully reset to initial enterprise seed', state: { risks: newState.risks.length, plans: newState.action_plans.length } });
});

export default router;
