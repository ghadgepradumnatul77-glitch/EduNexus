import { query } from '../db/connection.js';

/**
 * Feature Flag Service
 * Checks if a specific organization has a feature enabled.
 */
export const isFeatureEnabled = async (orgId, featureKey) => {
    try {
        const result = await query(
            'SELECT enabled FROM organization_features WHERE organization_id = $1 AND feature_key = $2',
            [orgId, featureKey]
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
        const orgId = req.tenantId || req.user?.orgId;
        if (!orgId) return res.status(403).json({ success: false, message: 'Organization context required.' });

        const enabled = await isFeatureEnabled(orgId, featureKey);
        if (!enabled) {
            return res.status(403).json({
                success: false,
                message: `The feature "${featureKey}" is not enabled for your organization.`
            });
        }
        next();
    };
};
