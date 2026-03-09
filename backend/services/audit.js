import { queueAuditLog } from '../queues/queueManager.js';

/**
 * Enterprise Audit Service
 * This is the production-grade logger for state transitions.
 * Offloads to background workers via BullMQ.
 */
export const logAudit = async (req, {
    action,
    entityType,
    entityId,
    beforeState,
    afterState,
    success = true
}) => {
    try {
        const logData = {
            actor_id: req.platformAdmin?.id || req.user?.id || null,
            actor_role: req.platformAdmin ? 'PLATFORM_ADMIN' : req.user?.role || null,
            tenant_id: req.tenantId || req.user?.tenantId || null,
            action_type: action,
            entity_type: entityType,
            entity_id: entityId,
            before_state: beforeState || null,
            after_state: afterState || null,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('user-agent'),
            request_id: req.get('X-Request-ID') || null,
            success: success,
            timestamp: new Date()
        };

        // Offload to background queue
        await queueAuditLog(logData);
    } catch (err) {
        console.error('Audit queue failure:', err);
    }
};

/**
 * Middleware version for generic logging
 */
export const auditMiddleware = (action, entityType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            logAudit(req, {
                action,
                entityType,
                afterState: req.body, // Log raw body as "after" state for generic middleware
                success: res.statusCode < 400
            });
            originalSend.call(this, data);
        };
        next();
    };
};
