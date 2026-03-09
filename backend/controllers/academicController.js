import { query } from '../db/connection.js';

// ------------------------------------------------------------------------------
// COURSES
// ------------------------------------------------------------------------------
export const getCourses = async (req, res) => {
    try {
        const result = await query(
            `SELECT c.*, u.first_name as faculty_first_name, u.last_name as faculty_last_name 
             FROM courses c
             JOIN users u ON c.faculty_id = u.id
             ORDER BY c.created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT c.*, u.first_name as faculty_first_name, u.last_name as faculty_last_name 
             FROM courses c
             JOIN users u ON c.faculty_id = u.id
             WHERE c.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch course.' });
    }
};

// ------------------------------------------------------------------------------
// ASSIGNMENTS
// ------------------------------------------------------------------------------
export const getAssignments = async (req, res) => {
    try {
        // If course_id is provided in query, filter by it
        const { course_id } = req.query;
        let q = `SELECT a.*, c.course_name, c.course_code 
                 FROM assignments a
                 JOIN courses c ON a.course_id = c.id`;
        let params = [];

        if (course_id) {
            q += ` WHERE a.course_id = $1`;
            params.push(course_id);
        }
        q += ` ORDER BY a.due_date ASC`;

        const result = await query(q, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
    }
};

export const createAssignment = async (req, res) => {
    try {
        const { course_id, title, description, due_date } = req.body;

        if (!course_id || !title || !description || !due_date) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Verify the faculty owns the course or is Admin
        if (req.user.role === 'Faculty') {
            const courseCheck = await query('SELECT faculty_id FROM courses WHERE id = $1', [course_id]);
            if (courseCheck.rows.length === 0 || courseCheck.rows[0].faculty_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized for this course.' });
            }
        }

        const result = await query(
            `INSERT INTO assignments (tenant_id, course_id, title, description, due_date, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.user.orgId, course_id, title, description, due_date, req.user.id]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Assignment created successfully.' });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to create assignment.' });
    }
};

// ------------------------------------------------------------------------------
// SUBMISSIONS
// ------------------------------------------------------------------------------
export const getStudentSubmissions = async (req, res) => {
    try {
        // Find submissions for the currently logged in student
        const result = await query(
            `SELECT s.*, a.title as assignment_title, c.course_name 
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             JOIN courses c ON a.course_id = c.id
             WHERE s.student_id = $1
             ORDER BY s.submitted_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submissions.' });
    }
};

export const createSubmission = async (req, res) => {
    try {
        const { assignment_id, submission_url } = req.body;
        if (!assignment_id || !submission_url) {
            return res.status(400).json({ success: false, message: 'Assignment ID and Submission URL are required.' });
        }

        const result = await query(
            `INSERT INTO submissions (tenant_id, assignment_id, student_id, submission_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (assignment_id, student_id) 
             DO UPDATE SET submission_url = EXCLUDED.submission_url, submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.orgId, assignment_id, req.user.id, submission_url]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Assignment submitted successfully.' });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ success: false, message: 'Failed to submit assignment.' });
    }
};
