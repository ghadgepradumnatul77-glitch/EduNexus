import express from 'express';
import { getItems, reportItem, claimItem } from '../controllers/lostFoundController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/items', getItems);
router.post('/report', reportItem);
// Admins or security personnel typically handle claiming
router.post('/claim', requireRole('Admin', 'Super Admin'), claimItem);

export default router;
