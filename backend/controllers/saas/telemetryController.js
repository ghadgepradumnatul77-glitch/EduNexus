import { publishEvent, EVENTS } from '../../services/eventBus.js';

/**
 * Log a product telemetry event
 * Used to track "Aha!" moments, friction, and onboarding progress.
 */
export const trackProductEvent = async (req, res) => {
    const { eventKey, eventType, metadata } = req.body;
    const orgId = req.tenantId; // From identity middleware
    const userId = req.user?.id;

    if (!eventKey) {
        return res.status(400).json({ success: false, message: 'eventKey is required.' });
    }

    try {
        // We use the eventBus for telemetry to keep API latency low
        await publishEvent(orgId, 'product.telemetry', {
            userId,
            eventKey,
            eventType: eventType || 'info',
            metadata: metadata || {},
            url: req.get('referer'),
            timestamp: new Date().toISOString()
        });

        res.status(202).json({ success: true }); // Accepted for processing
    } catch (error) {
        console.error('Telemetry track error:', error);
        res.status(500).json({ success: false, message: 'Telemetry failed.' });
    }
};
