import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Get Tenant Tier Information (Cached)
 */
const getTenantTierInfo = async (orgId) => {
    const cacheKey = `tenant:${orgId}:tier_info`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    const result = await query(
        `SELECT o.subscription_tier, o.subscription_status, p.max_users, p.max_storage_mb, p.features_json
     FROM organizations o
     JOIN subscription_plans p ON o.subscription_tier = p.name
     WHERE o.id = $1`,
        [orgId]
    );

    if (result.rows.length === 0) return null;

    const tierInfo = result.rows[0];
    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(tierInfo), 'EX', 600);

    return tierInfo;
};

/**
 * Middleware: Check if a feature is enabled for the tenant's tier
 */
export const checkFeatureAccess = (featureKey) => {
    return async (req, res, next) => {
        if (!req.tenantId) return next();

        try {
            const tierInfo = await getTenantTierInfo(req.tenantId);

            if (!tierInfo) {
                return res.status(403).json({ success: false, message: 'Subscription information not found.' });
            }

            // Soft Restriction: If payment failed, only allow GET requests (Read-Only)
            if (tierInfo.subscription_status === 'past_due' && req.method !== 'GET') {
                return res.status(402).json({
                    success: false,
                    message: 'Subscription payment is past due. Please update billing to restore write access.',
                    billingPortal: true
                });
            }

            // Hard Restriction: Suspended or Canceled
            if (['suspended', 'canceled'].includes(tierInfo.subscription_status)) {
                return res.status(403).json({ success: false, message: 'Subscription inactive. Access restricted.' });
            }

            // Feature Check
            const features = tierInfo.features_json || {};
            if (features[featureKey] !== true) {
                return res.status(403).json({
                    success: false,
                    message: `The '${featureKey}' feature is not available on your current plan.`,
                    upgradeRequired: true
                });
            }

            next();
        } catch (error) {
            console.error('Tier enforcement error:', error);
            res.status(500).json({ success: false, message: 'Error verifying subscription tier.' });
        }
    };
};

/**
 * Middleware: Check if a numeric quota has been reached
 */
export const checkQuota = (metricKey) => {
    return async (req, res, next) => {
        if (!req.tenantId) return next();

        try {
            const tierInfo = await getTenantTierInfo(req.tenantId);

            // Get current usage (from organization_usage summary table)
            const usageResult = await query(
                `SELECT current_user_count, current_storage_bytes FROM organization_usage WHERE organization_id = $1`,
                [req.tenantId]
            );

            const usage = usageResult.rows[0] || { current_user_count: 0, current_storage_bytes: 0 };

            if (metricKey === 'users' && usage.current_user_count >= tierInfo.max_users) {
                return res.status(403).json({
                    success: false,
                    message: 'User limit reached for your plan. Please upgrade to add more users.'
                });
            }

            if (metricKey === 'storage' && usage.current_storage_bytes >= (tierInfo.max_storage_mb * 1024 * 1024)) {
                return res.status(403).json({
                    success: false,
                    message: 'Storage limit reached for your plan. Please upgrade to upload more files.'
                });
            }

            next();
        } catch (error) {
            console.error('Quota enforcement error:', error);
            res.status(500).json({ success: false, message: 'Error verifying subscription quota.' });
        }
    };
};
