import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getRoles
} from '../controllers/userController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
    registerValidation,
    updateUserValidation,
    uuidValidation,
    paginationValidation
} from '../middleware/validation.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all roles (accessible by all authenticated users)
router.get('/roles', getRoles);

// Admin and Super Admin only routes
router.get(
    '/',
    requireRole('Admin', 'Super Admin'),
    paginationValidation,
    getUsers
);

router.get(
    '/:id',
    requireRole('Admin', 'Super Admin'),
    uuidValidation,
    getUserById
);

router.post(
    '/',
    requireRole('Admin', 'Super Admin'),
    registerValidation,
    auditLog('create_user', 'users'),
    createUser
);

router.put(
    '/:id',
    requireRole('Admin', 'Super Admin'),
    updateUserValidation,
    auditLog('update_user', 'users'),
    updateUser
);

router.delete(
    '/:id',
    requireRole('Admin', 'Super Admin'),
    uuidValidation,
    auditLog('delete_user', 'users'),
    deleteUser
);

export default router;
