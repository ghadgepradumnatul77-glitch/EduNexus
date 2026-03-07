import { query } from '../db/connection.js';

/**
 * SaaS Subscription & Trial Expiry Worker
 * Runs periodically to handle lifecycle transitions.
 */
export const startSubscriptionWorker = async () => {
    console.log('🚀 Subscription Lifecycle Worker started...');

    // Run every 24 hours (or more frequent if needed)
    setInterval(async () => {
        try {
            await handleExpiredTrials();
            await handleGracePeriodExpirations();
        } catch (error) {
            console.error('Subscription Worker Error:', error);
        }
    }, 24 * 60 * 60 * 1000);
};

/**
 * Transition expired trials to 'restricted'
 */
async function handleExpiredTrials() {
    console.log(' - Checking for expired trials...');
    const result = await query(`
        UPDATE organizations 
        SET status = 'restricted', 
            subscription_status = 'expired'
        WHERE subscription_tier = 'free' 
        AND subscription_status = 'trialing'
        AND trial_ends_at < CURRENT_TIMESTAMP
        AND status = 'active'
        RETURNING id, name
    `);

    if (result.rowCount > 0) {
        console.log(`✅ Restricted ${result.rowCount} expired trial tenants.`);
    }
}

/**
 * Handle failed payments that passed the 7-day grace period
 */
async function handleGracePeriodExpirations() {
    console.log(' - Checking for grace period expirations...');
    const result = await query(`
        UPDATE organizations 
        SET status = 'restricted',
            subscription_status = 'past_due'
        WHERE subscription_status = 'unpaid'
        AND last_payment_failed_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
        AND status = 'active'
        RETURNING id, name
    `);

    if (result.rowCount > 0) {
        console.log(`✅ Restricted ${result.rowCount} past-due tenants.`);
    }
}
