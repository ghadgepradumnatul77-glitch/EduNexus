import express from 'express';
import {
    createBetaProgram,
    listBetaPrograms,
    updateBetaProgram,
    submitFeedback,
    getFeedbackHistory
} from '../controllers/betaController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// Super Admin — program management
router.post('/programs', requireRole('Super Admin'), createBetaProgram);
router.get('/programs', requireRole('Super Admin'), listBetaPrograms);
router.patch('/programs/:id', requireRole('Super Admin'), updateBetaProgram);

// Institutional Admin — feedback
router.post('/feedback', requireRole('Admin', 'Super Admin'), submitFeedback);
router.get('/feedback', requireRole('Admin', 'Super Admin'), getFeedbackHistory);

export default router;
