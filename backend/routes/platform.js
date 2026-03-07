import express from 'express';
import { platformLogin, getTenants, updateTenantStatus, deleteTenant, changePlatformPassword } from '../controllers/platformController.js';
import { requirePlatformAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', platformLogin);

// Protected routes
router.use(requirePlatformAdmin);
router.post('/change-password', changePlatformPassword);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/status', updateTenantStatus);
router.delete('/tenants/:id', deleteTenant);

export default router;
