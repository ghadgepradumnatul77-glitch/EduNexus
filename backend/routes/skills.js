import express from 'express';
import {
    getMarketplace, createOffer,
    createRequest, createMatch
} from '../controllers/skillExchangeController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Allow reading the marketplace with optional auth or strict auth (using verifyToken for all initially as requested)
router.use(verifyToken);
router.get('/marketplace', getMarketplace);
router.post('/offer', createOffer);
router.post('/request', createRequest);
router.post('/match', createMatch);

export default router;
