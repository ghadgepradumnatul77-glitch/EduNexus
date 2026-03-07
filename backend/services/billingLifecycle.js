import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Process Expiring/Past Due Subscriptions
 * This background worker looks for 'past_due' organizations 
 * and applies soft restrictions or notifications.
 */
export const processBillingLifecycle = async () => {
    try {
        // 1. Identify past_due organizations beyond grace period (e.g., 7 days)
        const pastDueResult = await query(`
            SELECT id, name, subscription_status, current_period_end 
            FROM organizations 
            WHERE subscription_status = 'past_due' 
            AND current_period_end < (CURRENT_TIMESTAMP - INTERVAL '7 days')
        `);

        for (const org of pastDueResult.rows) {
            console.log(`⚠️ Restriction Tier: ${org.name} (${org.id}) is significantly past due.`);

            // Soft Restrict: The middleware already handles past_due, 
            // but we could flip them to 'free' tier or 'canceled' here.
            // For EduNexus, we keep them in 'past_due' to allow 'read-only' mode.
        }

        // 2. Identify expired trials
        const trialExpiryResult = await query(`
            UPDATE organizations 
            SET subscription_tier = 'free', 
                subscription_status = 'active',
                trial_end = NULL
            WHERE trial_end < CURRENT_TIMESTAMP 
            AND subscription_tier = 'enterprise' -- Assuming trials are for Enterprise
            RETURNING id, name
        `);

        for (const org of trialExpiryResult.rows) {
            console.log(`ℹ️ Trial Expired: ${org.name} downgraded to Free tier.`);
            await redis.del(`tenant:${org.id}:tier_info`);
        }

    } catch (error) {
        console.error('Billing lifecycle worker error:', error);
    }
};
