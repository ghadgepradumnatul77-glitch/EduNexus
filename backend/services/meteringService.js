import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Log a usage metric for a tenant
 */
export const logUsage = async (tenantId, metricKey, value = 1) => {
    if (!tenantId) return;

    try {
        // 1. Raw Log for Audit/Time-series
        await query(
            `INSERT INTO tenant_usage_metrics (tenant_id, metric_key, value) 
       VALUES ($1, $2, $3)`,
            [tenantId, metricKey, value]
        );

        // 2. Increment Running Cache (Redis) for real-time gating
        // We use a daily key for high-frequency metrics like API calls
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `tenant:${tenantId}:usage:${metricKey}:${today}`;
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
      INSERT INTO organization_usage (tenant_id, current_user_count)
      SELECT tenant_id, COUNT(*) 
      FROM users 
      WHERE is_deleted = FALSE 
      GROUP BY tenant_id
      ON CONFLICT (tenant_id) DO UPDATE SET 
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
        WHERE tenant_id = ou.tenant_id AND metric_key = 'storage_bytes'
      )
    `);

        console.log('✅ Usage summaries refreshed.');
    } catch (error) {
        console.error('Error refreshing usage summaries:', error);
    }
};
