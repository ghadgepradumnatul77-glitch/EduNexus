import express from 'express';
import {
    getCourses, getCourseById,
    getAssignments, createAssignment,
    getStudentSubmissions, createSubmission
} from '../controllers/academicController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// Courses
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', requireRole('Admin', 'Super Admin', 'Faculty'), createAssignment);

// Submissions
router.get('/submissions/student', requireRole('Student'), getStudentSubmissions);
router.post('/submissions', requireRole('Student'), createSubmission);

export default router;
