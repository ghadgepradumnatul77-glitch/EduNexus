import { query } from '../db/connection.js';

// GET /api/announcements
export const getAnnouncements = async (req, res) => {
    try {
        // Enforce RLS by using the standard tenant query
        const result = await query(
            `SELECT a.*, u.first_name, u.last_name 
             FROM announcements a
             JOIN users u ON a.created_by = u.id
             WHERE (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
             ORDER BY 
                CASE priority_level 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'normal' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                a.created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
    }
};

// GET /api/announcements/:id
export const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT a.*, u.first_name, u.last_name 
             FROM announcements a
             JOIN users u ON a.created_by = u.id
             WHERE a.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Announcement not found.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcement.' });
    }
};

// POST /api/announcements
export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, visibility_scope, department_id, expires_at, priority_level } = req.body;

        // Validation
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }

        const result = await query(
            `INSERT INTO announcements (tenant_id, title, content, visibility_scope, department_id, created_by, expires_at, priority_level)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                req.user.orgId, // Extracted by auth middleware
                title,
                content,
                visibility_scope || 'all_students',
                department_id || null,
                req.user.id,
                expires_at || null,
                priority_level || 'normal'
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Announcement created successfully.' });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ success: false, message: 'Failed to create announcement.' });
    }
};

// DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership or admin status before deleting
        // RLS handles tenant isolation, but we enforce role semantics here
        const checkResult = await query('SELECT created_by FROM announcements WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Announcement not found.' });
        }

        if (checkResult.rows[0].created_by !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'You can only delete your own announcements.' });
        }

        await query('DELETE FROM announcements WHERE id = $1', [id]);
        res.json({ success: true, message: 'Announcement deleted successfully.' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
    }
};
