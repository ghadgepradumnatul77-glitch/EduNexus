import { getScopedRedis } from '../utils/redis.js';

/**
 * Per-Tenant Rate Limiting Middleware
 * Uses Redis to track requests per tenant ID.
 */
export const tenantRateLimiter = (options = {}) => {
    const { windowMs = 60000, max = 100 } = options; // Default: 100 req per minute

    return async (req, res, next) => {
        if (!req.tenantId) return next(); // Skip if no tenant context

        const scopedRedis = getScopedRedis(req.tenantId);
        const key = `rate-limit:ip:${req.ip}`;

        try {
            const current = await scopedRedis.get(key);
            const requests = current ? parseInt(current) : 0;

            if (requests >= max) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests from this organization. Please try again later.',
                    retryAfter: windowMs / 1000
                });
            }

            const multi = scopedRedis.client.multi();
            multi.incr(`tenant:${req.tenantId}:${key}`);
            if (requests === 0) {
                multi.expire(`tenant:${req.tenantId}:${key}`, windowMs / 1000);
            }
            await multi.exec();

            next();
        } catch (error) {
            console.error('Rate limiting error:', error);
            next(); // Fail open for business continuity
        }
    };
};
