import express from 'express';
import {
    addMarks,
    getMarksByClass,
    getMarksByStudent,
    updateMarks,
    getMyMarks,
    deleteMarks
} from '../controllers/marksController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { marksValidation, uuidValidation } from '../middleware/validation.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Self marks
router.get('/my', getMyMarks);

// Add marks (Faculty and Admin only)
router.post(
    '/',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    marksValidation,
    auditLog('add_marks', 'marks'),
    addMarks
);

// Get marks by class (Faculty and Admin)
router.get(
    '/class/:classId',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    uuidValidation,
    getMarksByClass
);

// Get marks by student (accessible by student themselves, faculty, and admin)
router.get(
    '/student/:studentId',
    getMarksByStudent
);

// Update marks (Faculty and Admin only)
router.put(
    '/:id',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    uuidValidation,
    auditLog('update_marks', 'marks'),
    updateMarks
);

// Delete marks (Admin only)
router.delete(
    '/:id',
    requireRole('Admin', 'Super Admin'),
    uuidValidation,
    auditLog('delete_marks', 'marks'),
    deleteMarks
);

export default router;
