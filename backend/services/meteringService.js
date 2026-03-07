import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Log a usage metric for a tenant
 */
export const logUsage = async (orgId, metricKey, value = 1) => {
    if (!orgId) return;

    try {
        // 1. Raw Log for Audit/Time-series
        await query(
            `INSERT INTO tenant_usage_metrics (organization_id, metric_key, value) 
       VALUES ($1, $2, $3)`,
            [orgId, metricKey, value]
        );

        // 2. Increment Running Cache (Redis) for real-time gating
        // We use a daily key for high-frequency metrics like API calls
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `tenant:${orgId}:usage:${metricKey}:${today}`;
        await redis.incrby(cacheKey, value);
        await redis.expire(cacheKey, 86400 * 2); // 2 days TTL

    } catch (error) {
        console.error(`Usage logging error for ${metricKey}:`, error);
    }
};

/**
 * Background Task: Refresh Organization Usage Summary
 * This should run periodically (e.g., every hour) to sync the summary table.
 */
export const refreshUsageSummaries = async () => {
    try {
        // 1. Update User Counts
        await query(`
      INSERT INTO organization_usage (organization_id, current_user_count)
      SELECT organization_id, COUNT(*) 
      FROM users 
      WHERE is_deleted = FALSE 
      GROUP BY organization_id
      ON CONFLICT (organization_id) DO UPDATE SET 
        current_user_count = EXCLUDED.current_user_count,
        last_updated = CURRENT_TIMESTAMP
    `);

        // 2. Update Storage (assuming storage metrics are logged via API/Uploads)
        // Here we'd aggregate from tenant_usage_metrics if not using a separate file metadata table
        await query(`
      UPDATE organization_usage ou
      SET current_storage_bytes = (
        SELECT COALESCE(SUM(value), 0) 
        FROM tenant_usage_metrics 
        WHERE organization_id = ou.organization_id AND metric_key = 'storage_bytes'
      )
    `);

        console.log('✅ Usage summaries refreshed.');
    } catch (error) {
        console.error('Error refreshing usage summaries:', error);
    }
};
