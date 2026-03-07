import express from 'express';
import * as tenantController from '../controllers/saas/tenantController.js';
import * as dashboardController from '../controllers/saas/dashboardController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Super Admin Routes
 * Protected by: JWT + Super Admin Role
 */
router.use(verifyToken);
// Super Admin role name from global config/seeding
router.use(requireRole('Super Admin'));

router.post('/tenants', tenantController.createTenant);
router.get('/tenants', tenantController.getAllTenants);
router.patch('/tenants/:id/status', tenantController.updateTenantStatus);

// Platform Insights
router.get('/dashboard', dashboardController.getDashboardSummary);
router.get('/dashboard/kpis', dashboardController.getPlatformKPIs);
router.get('/dashboard/rankings', dashboardController.getTenantRankings);
router.get('/dashboard/beta-insights', dashboardController.getBetaInsights);

export default router;
