import express from 'express';
import * as onboardingController from '../controllers/saas/onboardingController.js';
import * as telemetryController from '../controllers/saas/telemetryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public Onboarding
 */
router.post('/signup', onboardingController.registerOrganization);

/**
 * Protected Onboarding Wizard (Post-Login)
 */
router.patch('/wizard', verifyToken, onboardingController.updateOnboardingStep);

/**
 * Product Telemetry (PMF Signals)
 */
router.post('/telemetry', verifyToken, telemetryController.trackProductEvent);

export default router;
