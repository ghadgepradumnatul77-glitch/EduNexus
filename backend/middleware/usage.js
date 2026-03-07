import { usageQueue } from '../queues/queueManager.js';

/**
 * Enterprise Usage Tracker
 * Asynchronously logs tenant API calls for billing and resource monitoring.
 */
export const trackUsage = async (req, res, next) => {
    const orgId = req.tenantId || req.user?.orgId;

    if (orgId) {
        // Queue the usage metric - don't wait for it
        usageQueue.add('track', { orgId, type: 'api_call' }, {
            removeOnComplete: true,
            attempts: 1
        }).catch(err => console.error('Usage queue error:', err));
    }

    next();
};
