import { query } from '../db/connection.js';

/**
 * Feature Flag Service
 * Checks if a specific organization has a feature enabled.
 */
export const isFeatureEnabled = async (tenantId, featureKey) => {
    try {
        const result = await query(
            'SELECT enabled FROM organization_features WHERE tenant_id = $1 AND feature_key = $2',
            [tenantId, featureKey]
        );

        if (result.rows.length === 0) {
            // Default behavior: if flag is missing, feature is disabled for enterprise safety
            return false;
        }

        return result.rows[0].enabled;
    } catch (error) {
        console.error(`Feature flag check error [${featureKey}]:`, error);
        return false;
    }
};

/**
 * Middleware version
 */
export const requireFeature = (featureKey) => {
    return async (req, res, next) => {
        const tenantId = req.tenantId || req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ success: false, message: 'Organization context required.' });

        const enabled = await isFeatureEnabled(tenantId, featureKey);
        if (!enabled) {
            return res.status(403).json({
                success: false,
                message: `The feature "${featureKey}" is not enabled for your organization.`
            });
        }
        next();
    };
};
