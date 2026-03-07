import redis from '../utils/redis.js';

const STREAM_NAME = 'edunexus_events';

/**
 * Event Types Constant
 */
export const EVENTS = {
    AUDIT_LOG: 'audit.logged',
    USAGE_TRACKED: 'usage.tracked',
    SUBSCRIPTION_UPDATED: 'billing.subscription_updated',
    TENANT_PROVISIONED: 'tenant.provisioned'
};

/**
 * Initialize Event Bus
 * Creates the consumer group if it doesn't exist.
 */
export const initEventBus = async () => {
    try {
        // Create consumer group 'api_consumers' starting from the beginning of the stream ($ for new only)
        // MKSTREAM ensures the stream is created if it doesn't exist
        await redis.xgroup('CREATE', STREAM_NAME, 'api_consumers', '$', 'MKSTREAM');
        console.log('✅ Event Bus Consumer Group initialized.');
    } catch (err) {
        if (err.message.includes('BUSYGROUP')) {
            // Group already exists, this is fine
        } else {
            console.error('Failed to initialize Event Bus:', err);
        }
    }
};

/**
 * Publish an event to the SaaS Event Bus (Redis Streams)
 */
export const publishEvent = async (tenantId, eventType, data = {}) => {
    try {
        const payload = [
            'tenantId', tenantId || 'system',
            'eventType', eventType,
            'timestamp', Date.now().toString(),
            'data', JSON.stringify(data)
        ];

        // XADD with MAXLEN ~ 100000 ensures the stream doesn't grow indefinitely
        await redis.xadd(STREAM_NAME, 'MAXLEN', '~', 100000, '*', ...payload);

    } catch (error) {
        console.error(`Failed to publish event ${eventType}:`, error);
        // Fallback or retry logic could go here
    }
};
