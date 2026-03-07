import express from 'express';
import * as billingController from '../controllers/billingController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Stripe Webhook (Public)
 * IMPORTANT: This route requires the RAW request body for signature verification.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

/**
 * Protected Billing Routes
 */
router.use(verifyToken);

// Future: router.post('/checkout', billingController.initiateCheckout);
// Future: router.get('/portal', billingController.redirectToPortal);

export default router;
