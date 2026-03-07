import express from 'express';
import { getAttendanceTrends, getMarksTrends } from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/attendance-trends', getAttendanceTrends);
router.get('/marks-trends', getMarksTrends);

export default router;
