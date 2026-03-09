import { query } from '../db/connection.js';

// GET /api/skills/marketplace
export const getMarketplace = async (req, res) => {
    try {
        const offers = await query(
            `SELECT o.*, s.skill_name, s.category, u.first_name, u.last_name
             FROM skill_offers o
             JOIN skills s ON o.skill_id = s.id
             JOIN users u ON o.student_id = u.id
             WHERE o.status = 'active'
             ORDER BY o.created_at DESC`
        );

        const requests = await query(
            `SELECT r.*, s.skill_name, s.category, u.first_name, u.last_name
             FROM skill_requests r
             JOIN skills s ON r.skill_id = s.id
             JOIN users u ON r.student_id = u.id
             WHERE r.status = 'open'
             ORDER BY r.created_at DESC`
        );

        res.json({ success: true, data: { offers: offers.rows, requests: requests.rows } });
    } catch (error) {
        console.error('Error fetching marketplace:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch marketplace.' });
    } // RLS ensures tenant isolation
};

// Helper function to get or create skill
const getOrCreateSkill = async (skill_name, category, tenant_id) => {
    let skillRes = await query('SELECT id FROM skills WHERE tenant_id = $1 AND skill_name = $2', [tenant_id, skill_name]);
    if (skillRes.rows.length === 0) {
        skillRes = await query(
            'INSERT INTO skills (tenant_id, skill_name, category) VALUES ($1, $2, $3) RETURNING id',
            [tenant_id, skill_name, category]
        );
    }
    return skillRes.rows[0].id;
};

// POST /api/skills/offer
export const createOffer = async (req, res) => {
    try {
        const { skill_name, category, description, availability } = req.body;
        if (!skill_name || !category || !description || !availability) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        const skill_id = await getOrCreateSkill(skill_name, category, req.user.orgId);

        const result = await query(
            `INSERT INTO skill_offers (tenant_id, student_id, skill_id, description, availability)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (student_id, skill_id) DO UPDATE 
             SET description = EXCLUDED.description, availability = EXCLUDED.availability, status = 'active'
             RETURNING *`,
            [req.user.orgId, req.user.id, skill_id, description, availability]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Offer created.' });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'Failed to create offer.' });
    }
};

// POST /api/skills/request
export const createRequest = async (req, res) => {
    try {
        const { skill_name, category, description } = req.body;
        if (!skill_name || !category || !description) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        const skill_id = await getOrCreateSkill(skill_name, category, req.user.orgId);

        const result = await query(
            `INSERT INTO skill_requests (tenant_id, student_id, skill_id, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.orgId, req.user.id, skill_id, description]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Request created.' });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ success: false, message: 'Failed to create request.' });
    }
};

// POST /api/skills/match
export const createMatch = async (req, res) => {
    try {
        const { offer_id, request_id } = req.body;
        if (!offer_id || !request_id) {
            return res.status(400).json({ success: false, message: 'Offer and Request IDs required' });
        }

        const result = await query(
            `INSERT INTO skill_matches (tenant_id, offer_id, request_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (offer_id, request_id) DO NOTHING
             RETURNING *`,
            [req.user.orgId, offer_id, request_id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Match already exists.' });
        }
        res.status(201).json({ success: true, data: result.rows[0], message: 'Match proposed successfully.' });
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ success: false, message: 'Failed to create match.' });
    }
};
