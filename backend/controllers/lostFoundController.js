import { query } from '../db/connection.js';

// GET /api/lostfound/items
export const getItems = async (req, res) => {
    try {
        const { category, status } = req.query;
        let q = `SELECT i.*, u.first_name, u.last_name
                 FROM lost_found_items i
                 JOIN users u ON i.reported_by = u.id`;
        const params = [];

        if (category || status) {
            q += ` WHERE `;
            const conditions = [];
            if (category) {
                params.push(category);
                conditions.push(`i.category = $${params.length}`);
            }
            if (status) {
                params.push(status);
                conditions.push(`i.status = $${params.length}`);
            }
            q += conditions.join(' AND ');
        }

        q += ` ORDER BY i.reported_at DESC`;

        const result = await query(q, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch items.' });
    }
};

// POST /api/lostfound/report
export const reportItem = async (req, res) => {
    try {
        const { item_name, description, category, status, location, image_url } = req.body;

        if (!item_name || !description || !category || !status || !location) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const result = await query(
            `INSERT INTO lost_found_items (tenant_id, item_name, description, category, status, reported_by, location, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.user.orgId, item_name, description, category, status, req.user.id, location, image_url || null]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Item reported successfully.' });
    } catch (error) {
        console.error('Error reporting item:', error);
        res.status(500).json({ success: false, message: 'Failed to report item.' });
    }
};

// POST /api/lostfound/claim
export const claimItem = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Item ID required.' });
        }

        // Verify it's not already claimed
        const itemResult = await query('SELECT status FROM lost_found_items WHERE id = $1', [id]);
        if (itemResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }

        if (itemResult.rows[0].status === 'claimed') {
            return res.status(400).json({ success: false, message: 'Item is already claimed.' });
        }

        const result = await query(
            `UPDATE lost_found_items 
             SET status = 'claimed', resolved_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        res.json({ success: true, data: result.rows[0], message: 'Item marked as claimed.' });
    } catch (error) {
        console.error('Error claiming item:', error);
        res.status(500).json({ success: false, message: 'Failed to claim item.' });
    }
};
