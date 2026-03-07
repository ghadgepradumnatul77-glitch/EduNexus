import express from 'express';
import {
    markAttendance,
    getAttendanceByClass,
    getAttendanceByStudent,
    getMyAttendance,
    getAttendanceStats
} from '../controllers/attendanceController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attendanceValidation, uuidValidation } from '../middleware/validation.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Self attendance
router.get('/my', getMyAttendance);

// Mark attendance (Faculty and Admin only)
router.post(
    '/',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    attendanceValidation,
    auditLog('mark_attendance', 'attendance'),
    markAttendance
);

// Get attendance by class (Faculty and Admin)
router.get(
    '/class/:classId',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    uuidValidation,
    getAttendanceByClass
);

// Get attendance by student (accessible by student themselves, faculty, and admin)
router.get(
    '/student/:studentId',
    getAttendanceByStudent
);

// Get attendance statistics
router.get(
    '/stats',
    requireRole('Faculty', 'Admin', 'Super Admin'),
    getAttendanceStats
);

export default router;
