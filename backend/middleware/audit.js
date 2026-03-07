import { publishEvent, EVENTS } from '../services/eventBus.js';

// Audit log middleware
export const auditLog = (action, entityType = null) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after response
        res.send = function (data) {
            // Log the action
            const logData = {
                userId: req.user?.id || null,
                action,
                entityType,
                entityId: req.params?.id || null,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                details: {
                    method: req.method,
                    path: req.path,
                    body: req.body,
                    query: req.query
                }
            };

            // Publish to Event Bus instead of direct DB write
            publishEvent(req.tenantId, EVENTS.AUDIT_LOG, logData)
                .catch(err => console.error('Audit publish error:', err));

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};
