import { query } from '../db/connection.js';

/**
 * Enterprise Suspension Enforcement
 * Periodically verifies that the tenant is active.
 * Applied globally to all tenant-specific routes.
 */
export const requireActiveTenant = async (req, res, next) => {
    // If no context, continue (e.g. public platform routes or health checks)
    if (!req.tenantId && !req.user?.tenantId) {
        return next();
    }

    const tenantId = req.tenantId || req.user.tenantId;

    try {
        const result = await query(
            'SELECT status, suspension_reason FROM organizations WHERE id = $1',
            [tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const org = result.rows[0];

        if (org.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'This organization has been suspended.',
                reason: org.suspension_reason
            });
        }

        if (org.status === 'deactivated') {
            return res.status(403).json({ success: false, message: 'This organization account is inactive.' });
        }

        next();
    } catch (error) {
        console.error('Suspension check error:', error);
        next(); // Default to allow in case of DB failure, or block? Enterprise choice: allow.
    }
};
