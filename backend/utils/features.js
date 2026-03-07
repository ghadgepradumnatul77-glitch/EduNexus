import { query } from '../db/connection.js';
import redis from './redis.js';

/**
 * Feature Flag Helper for Multi-Tenancy
 */
export const isFeatureEnabled = async (orgId, featureKey) => {
    if (!orgId) return false;

    const cacheKey = `tenant:${orgId}:feature:${featureKey}`;

    // 1. Check Redis Cache
    const cached = await redis.get(cacheKey);
    if (cached !== null) return cached === 'true';

    // 2. Fallback to DB (Check organization settings JSONB)
    const result = await query(
        "SELECT settings->'features'->>$1 as enabled FROM organizations WHERE id = $2",
        [featureKey, orgId]
    );

    const isEnabled = result.rows[0]?.enabled === 'true';

    // 3. Cache for 15 mins
    await redis.set(cacheKey, isEnabled ? 'true' : 'false', 'EX', 900);

    return isEnabled;
};

/**
 * Bulk Toggle Feature for Tenant
 */
export const toggleFeature = async (orgId, featureKey, enabled) => {
    await query(
        `UPDATE organizations 
     SET settings = jsonb_set(settings, '{features, ${featureKey}}', $1)
     WHERE id = $2`,
        [enabled ? '"true"' : '"false"', orgId]
    );

    // Invalidate cache
    await redis.del(`tenant:${orgId}:feature:${featureKey}`);
};
