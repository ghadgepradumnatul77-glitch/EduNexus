import { query } from '../db/connection.js';

// Add or update marks
export const addMarks = async (req, res) => {
    try {
        const { classId, studentId, examType, examName, marksObtained, maxMarks, examDate, remarks } = req.body;

        const result = await query(
            `INSERT INTO marks (class_id, student_id, exam_type, exam_name, marks_obtained, max_marks, exam_date, remarks, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [classId, studentId, examType, examName, marksObtained, maxMarks, examDate, remarks, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Marks added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Add marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get marks by class
export const getMarksByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { examType } = req.query;

        let queryText = `
      SELECT m.*, u.first_name, u.last_name, u.email
      FROM marks m
      JOIN users u ON m.student_id = u.id
      WHERE m.class_id = $1
    `;
        const params = [classId];

        if (examType) {
            queryText += ' AND m.exam_type = $2';
            params.push(examType);
        }

        queryText += ' ORDER BY m.exam_date DESC, u.last_name, u.first_name';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get marks by student
export const getMarksByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { classId, examType } = req.query;

        let queryText = `
      SELECT m.*, c.semester, c.academic_year, co.name as course_name, co.code as course_code
      FROM marks m
      JOIN classes c ON m.class_id = c.id
      JOIN courses co ON c.course_id = co.id
      WHERE m.student_id = $1
    `;
        const params = [studentId];
        let paramCount = 2;

        if (classId) {
            queryText += ` AND m.class_id = $${paramCount}`;
            params.push(classId);
            paramCount++;
        }

        if (examType) {
            queryText += ` AND m.exam_type = $${paramCount}`;
            params.push(examType);
            paramCount++;
        }

        queryText += ' ORDER BY m.exam_date DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// GET /api/marks/my
export const getMyMarks = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await query(
            `SELECT m.*, c.semester, c.academic_year, co.name as course_name 
             FROM marks m
             LEFT JOIN classes c ON m.class_id = c.id
             LEFT JOIN courses co ON c.course_id = co.id
             WHERE m.student_id = $1 
             ORDER BY m.exam_date DESC`,
            [studentId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update marks
export const updateMarks = async (req, res) => {
    try {
        const { id } = req.params;
        const { marksObtained, maxMarks, remarks } = req.body;

        const updates = [];
        const params = [];
        let paramCount = 1;

        if (marksObtained !== undefined) {
            updates.push(`marks_obtained = $${paramCount}`);
            params.push(marksObtained);
            paramCount++;
        }

        if (maxMarks !== undefined) {
            updates.push(`max_marks = $${paramCount}`);
            params.push(maxMarks);
            paramCount++;
        }

        if (remarks !== undefined) {
            updates.push(`remarks = $${paramCount}`);
            params.push(remarks);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        const result = await query(
            `UPDATE marks 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Marks record not found'
            });
        }

        res.json({
            success: true,
            message: 'Marks updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete marks
export const deleteMarks = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM marks WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Marks record not found'
            });
        }

        res.json({
            success: true,
            message: 'Marks deleted successfully'
        });
    } catch (error) {
        console.error('Delete marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
