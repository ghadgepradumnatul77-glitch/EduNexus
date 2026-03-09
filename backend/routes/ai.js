import express from 'express';
import { handleChat } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/chat', handleChat);

export default router;
