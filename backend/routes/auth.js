import express from 'express';
import { login, refreshToken, logout, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { loginValidation } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/security.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// Public routes
router.post('/login', loginLimiter, loginValidation, auditLog('login'), login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', verifyToken, auditLog('logout'), logout);
router.get('/me', verifyToken, getCurrentUser);

export default router;
