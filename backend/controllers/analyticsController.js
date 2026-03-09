import { query } from '../db/connection.js';

export const getAttendanceTrends = async (req, res) => {
    try {
        const result = await query(
            `SELECT date, 
                    COUNT(*) FILTER (WHERE status = 'present') as present,
                    COUNT(*) FILTER (WHERE status = 'absent') as absent
             FROM attendance
             WHERE tenant_id = $1
             GROUP BY date
             ORDER BY date DESC
             LIMIT 14`,
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analytics failure' });
    }
};

export const getMarksTrends = async (req, res) => {
    try {
        const result = await query(
            `SELECT exam_type, AVG(marks_obtained / max_marks * 100) as average_marks
             FROM marks
             WHERE tenant_id = $1
             GROUP BY exam_type`,
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analytics failure' });
    }
};
