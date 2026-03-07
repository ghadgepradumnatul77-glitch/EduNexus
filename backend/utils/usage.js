import { publishEvent, EVENTS } from '../services/eventBus.js';

/**
 * SaaS Usage Tracking Utility
 */
export const trackUsage = async (orgId, metric, value = 1) => {
    if (!orgId) return;

    try {
        // Publish to Event Bus
        await publishEvent(orgId, EVENTS.USAGE_TRACKED, { metric, value });
    } catch (error) {
        console.error('Usage track error:', error);
    }
};

/**
 * Get Tenant Resource Usage
 */
export const getTenantUsageSummary = async (orgId) => {
    const result = await query(
        `SELECT metric, SUM(value) as total 
     FROM organization_usage 
     WHERE organization_id = $1 
     GROUP BY metric`,
        [orgId]
    );
    return result.rows;
};
