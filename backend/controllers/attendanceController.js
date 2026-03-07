import { query } from '../db/connection.js';
import { cacheGet, cacheSet } from '../config/redis.js';

// Mark attendance
export const markAttendance = async (req, res) => {
    try {
        const { classId, studentId, date, status, remarks } = req.body;

        // Check if attendance already exists
        const existing = await query(
            'SELECT id FROM attendance WHERE class_id = $1 AND student_id = $2 AND date = $3',
            [classId, studentId, date]
        );

        if (existing.rows.length > 0) {
            // Update existing attendance
            const result = await query(
                `UPDATE attendance 
         SET status = $1, remarks = $2, marked_by = $3
         WHERE class_id = $4 AND student_id = $5 AND date = $6
         RETURNING *`,
                [status, remarks, req.user.id, classId, studentId, date]
            );

            return res.json({
                success: true,
                message: 'Attendance updated successfully',
                data: result.rows[0]
            });
        }

        // Create new attendance record
        const result = await query(
            `INSERT INTO attendance (class_id, student_id, date, status, remarks, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [classId, studentId, date, status, remarks, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get attendance by class
export const getAttendanceByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        let queryText = `
      SELECT a.*, u.first_name, u.last_name, u.email
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.class_id = $1
    `;
        const params = [classId];
        let paramCount = 2;

        if (startDate) {
            queryText += ` AND a.date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            queryText += ` AND a.date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        queryText += ' ORDER BY a.date DESC, u.last_name, u.first_name';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get attendance by student
export const getAttendanceByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { classId, startDate, endDate } = req.query;

        let queryText = `
      SELECT a.*
      FROM attendance a
      WHERE a.student_id = $1
    `;
        const params = [studentId];
        let paramCount = 2;

        if (classId) {
            queryText += ` AND a.class_id = $${paramCount}`;
            params.push(classId);
            paramCount++;
        }

        if (startDate) {
            queryText += ` AND a.date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            queryText += ` AND a.date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        queryText += ' ORDER BY a.date DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// GET /api/attendance/my
export const getMyAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;

        const recordsRes = await query(
            'SELECT date, status FROM attendance WHERE student_id = $1 ORDER BY date DESC LIMIT 100',
            [studentId]
        );

        const statsRes = await query(
            `SELECT 
                status, COUNT(*)::INT as count 
             FROM attendance 
             WHERE student_id = $1 
             GROUP BY status`,
            [studentId]
        );

        const statsMap = {};
        statsRes.rows.forEach(r => { statsMap[r.status] = r.count; });

        const total = statsRes.rows.reduce((s, r) => s + r.count, 0);

        res.json({
            success: true,
            data: {
                records: recordsRes.rows,
                stats: {
                    total,
                    present: statsMap['present'] || 0,
                    absent: statsMap['absent'] || 0,
                    late: statsMap['late'] || 0
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get attendance statistics
export const getAttendanceStats = async (req, res) => {
    try {
        const { classId, studentId } = req.query;

        // Try to get from cache
        const cacheKey = `attendance:stats:${classId || 'all'}:${studentId || 'all'}`;
        const cached = await cacheGet(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        let queryText = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM attendance
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (classId) {
            queryText += ` AND class_id = $${paramCount}`;
            params.push(classId);
            paramCount++;
        }

        if (studentId) {
            queryText += ` AND student_id = $${paramCount}`;
            params.push(studentId);
            paramCount++;
        }

        queryText += ' GROUP BY status ORDER BY count DESC';

        const result = await query(queryText, params);

        const stats = {
            breakdown: result.rows,
            total: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
        };

        // Cache for 5 minutes
        await cacheSet(cacheKey, stats, 300);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get attendance stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
