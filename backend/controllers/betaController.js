import { query } from '../db/connection.js';

// ─── Super Admin ────────────────────────────────────────────────────────────

/**
 * POST /api/beta/programs
 * Enrol an existing organisation into the beta program.
 */
export const createBetaProgram = async (req, res, next) => {
    try {
        const { tenant_id, cohort, contact_name, contact_email, ends_at, notes } = req.body;

        if (!tenant_id) {
            return res.status(400).json({ success: false, message: 'tenant_id is required' });
        }

        // Verify org exists
        const orgCheck = await query('SELECT id, name, slug FROM organizations WHERE id = $1', [tenant_id]);
        if (orgCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const result = await query(
            `INSERT INTO beta_programs
                (tenant_id, cohort, contact_name, contact_email, ends_at, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                tenant_id,
                cohort || '2026-Q1',
                contact_name || null,
                contact_email || null,
                ends_at || null,
                notes || null
            ]
        );

        res.status(201).json({
            success: true,
            message: `✅ ${orgCheck.rows[0].name} enrolled in beta program`,
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'This organisation is already enrolled in a beta program' });
        }
        next(err);
    }
};

/**
 * GET /api/beta/programs
 * List all beta institutions with NPS averages.
 */
export const listBetaPrograms = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT
                bp.*,
                o.name   AS org_name,
                o.slug   AS org_slug,
                o.plan   AS subscription_plan,
                COUNT(DISTINCT bf.id)::INT        AS feedback_count,
                ROUND(AVG(bf.nps_score), 1)       AS avg_nps,
                ROUND(AVG(bf.overall_rating), 1)  AS avg_rating,
                (SELECT COUNT(*) FROM users u WHERE u.tenant_id = bp.tenant_id)::INT AS user_count
             FROM beta_programs bp
             JOIN organizations o ON o.id = bp.tenant_id
             LEFT JOIN beta_feedback bf ON bf.tenant_id = bp.tenant_id
             GROUP BY bp.id, o.name, o.slug, o.plan
             ORDER BY bp.enrolled_at DESC`,
            []
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/beta/programs/:id
 * Update beta program status or details.
 */
export const updateBetaProgram = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, contact_name, contact_email, notes } = req.body;

        const result = await query(
            `UPDATE beta_programs
             SET status        = COALESCE($1, status),
                 contact_name  = COALESCE($2, contact_name),
                 contact_email = COALESCE($3, contact_email),
                 notes         = COALESCE($4, notes)
             WHERE id = $5
             RETURNING *`,
            [status, contact_name, contact_email, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Beta program not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── Institutional Admin ─────────────────────────────────────────────────────

/**
 * POST /api/beta/feedback
 * Submit a weekly check-in feedback form.
 */
export const submitFeedback = async (req, res, next) => {
    try {
        const {
            nps_score, overall_rating, friction_points,
            feature_requests, positive_highlights,
            would_pay, willing_to_refer
        } = req.body;

        const tenantId = req.tenant?.organizationId;
        const userId = req.user?.id;

        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        // Check they are in the beta program
        const betaCheck = await query(
            'SELECT id FROM beta_programs WHERE tenant_id = $1 AND status = $2',
            [tenantId, 'active']
        );
        if (betaCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Your organisation is not enrolled in the active beta program' });
        }

        const now = new Date();
        const weekNumber = getISOWeek(now);
        const year = now.getFullYear();

        const result = await query(
            `INSERT INTO beta_feedback
                (tenant_id, submitted_by, week_number, year, nps_score, overall_rating,
                 friction_points, feature_requests, positive_highlights, would_pay, willing_to_refer)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT (tenant_id, week_number, year)
             DO UPDATE SET
                nps_score           = EXCLUDED.nps_score,
                overall_rating      = EXCLUDED.overall_rating,
                friction_points     = EXCLUDED.friction_points,
                feature_requests    = EXCLUDED.feature_requests,
                positive_highlights = EXCLUDED.positive_highlights,
                would_pay           = EXCLUDED.would_pay,
                willing_to_refer    = EXCLUDED.willing_to_refer
             RETURNING *`,
            [
                tenantId, userId, weekNumber, year,
                nps_score ?? null, overall_rating ?? null,
                friction_points || null, feature_requests || null,
                positive_highlights || null,
                would_pay ?? false, willing_to_refer ?? false
            ]
        );

        res.status(201).json({
            success: true,
            message: `Week ${weekNumber} feedback recorded. Thank you!`,
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/beta/feedback
 * Tenant: own history. Super Admin: all feedback (pass ?org_id=).
 */
export const getFeedbackHistory = async (req, res, next) => {
    try {
        const isSuperAdmin = req.user?.role === 'Super Admin';
        const tenantId = isSuperAdmin
            ? (req.query.org_id || null)
            : req.tenant?.organizationId;

        const params = [];
        let where = '';
        if (tenantId) {
            params.push(tenantId);
            where = `WHERE bf.tenant_id = $${params.length}`;
        }

        const result = await query(
            `SELECT
                bf.*,
                o.name   AS org_name,
                o.slug   AS org_slug,
                u.first_name || ' ' || u.last_name AS submitted_by_name
             FROM beta_feedback bf
             JOIN organizations o ON o.id = bf.tenant_id
             LEFT JOIN users u ON u.id = bf.submitted_by
             ${where}
             ORDER BY bf.year DESC, bf.week_number DESC
             LIMIT 52`,
            params
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** ISO 8601 week number */
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
