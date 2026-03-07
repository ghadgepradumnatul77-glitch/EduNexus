import redis from '../config/redis.js';

/**
 * Enterprise Multi-Layer Rate Limiter
 * Enables distinct limits for Global, IP, and Organization layers.
 */
const createLimiter = ({ windowMs, max, keyPrefix, identifierFn }) => {
    return async (req, res, next) => {
        const identifier = identifierFn(req);
        if (!identifier) return next();

        const key = `ratelimit:${keyPrefix}:${identifier}`;

        try {
            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, Math.floor(windowMs / 1000));
            }

            if (current > max) {
                // Forensic logging for excessive attempts
                console.warn(`[RATE_LIMIT] ${keyPrefix} exceeded by ${identifier}`);

                return res.status(429).json({
                    success: false,
                    message: `Too many requests at the ${keyPrefix} level. Please try again later.`,
                    retryAfter: Math.floor(windowMs / 1000)
                });
            }

            res.setHeader(`X-RateLimit-${keyPrefix}-Limit`, max);
            res.setHeader(`X-RateLimit-${keyPrefix}-Remaining`, Math.max(0, max - current));

            next();
        } catch (error) {
            console.error('Rate limiting error:', error);
            next();
        }
    };
};

// Layer 1: Global Limiter (Catch-all)
export const globalLimiter = createLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5000,
    keyPrefix: 'global',
    identifierFn: () => 'all'
});

// Layer 2: Per-IP Limiter
export const ipLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyPrefix: 'ip',
    identifierFn: (req) => req.ip
});

// Layer 3: Per-Organization Limiter
export const orgLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    keyPrefix: 'org',
    identifierFn: (req) => req.tenantId || req.user?.orgId
});

// Specialized Strict Limiter for Auth/Sensistive routes
export const strictAuthLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: 'strict-auth',
    identifierFn: (req) => req.ip
});
