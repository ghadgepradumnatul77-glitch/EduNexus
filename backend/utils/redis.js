import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    maxRetriesPerRequest: 0, // Fail fast if Redis is down 
    connectTimeout: 5000,
    retryStrategy: (times) => {
        if (process.env.NODE_ENV !== 'production' && times > 3) {
            return null; // Stop trying in dev
        }
        return Math.min(times * 200, 3000);
    }
});

// Handle connection errors gracefully
redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        // Only log once every 30 seconds to avoid spam
        if (!redis.lastWarnTime || Date.now() - redis.lastWarnTime > 30000) {
            console.warn('⚠️ Redis not found. Background workers will wait...');
            redis.lastWarnTime = Date.now();
        }
    } else {
        console.error('❌ Redis error:', err);
    }
});

/**
 * Check if Redis is actually connected
 */
export const isRedisConnected = () => redis.status === 'ready';

// Intercept commands to prevent crashes when Redis is offline in dev
if (process.env.NODE_ENV !== 'production') {
    const handleOffline = (cmd, fallback) => {
        const original = redis[cmd];
        redis[cmd] = async (...args) => {
            try {
                if (redis.status !== 'ready' && redis.status !== 'connecting' && redis.status !== 'reconnecting') {
                    return typeof fallback === 'function' ? fallback(...args) : fallback;
                }
                return await original.call(redis, ...args);
            } catch (e) {
                console.warn(`⚠️ Redis command [${cmd}] failed (offline mode):`, e.message);
                return typeof fallback === 'function' ? fallback(...args) : fallback;
            }
        };
    };

    handleOffline('xgroup', 'OK');
    handleOffline('xadd', 'MOCK_ID');
    handleOffline('get', null);
    handleOffline('set', 'OK');
    handleOffline('del', 0);
    handleOffline('expire', 0);
    handleOffline('exists', 0);
    handleOffline('incr', 1);
}

/**
 * Enterprise Cache Helpers
 */
export const cacheGet = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null; // Already handled by wrapper but kept for safety
    }
};

export const cacheSet = async (key, value, ttlSeconds = 3600) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
    } catch (err) {
        return false;
    }
};

/**
 * Redis Scoping Wrapper for Multi-Tenancy
 * Automatically prefixes keys with 'tenant:{orgId}:'
 */
export const getScopedRedis = (orgId) => {
    if (!orgId) {
        throw new Error('Redis operation attempted without organization context (orgId missing)');
    }

    const prefix = `tenant:${orgId}:`;

    return {
        get: (key) => redis.get(`${prefix}${key}`),
        set: (key, value, expiryMode, time) => {
            if (expiryMode && time) {
                return redis.set(`${prefix}${key}`, value, expiryMode, time);
            }
            return redis.set(`${prefix}${key}`, value);
        },
        del: (key) => redis.del(`${prefix}${key}`),
        expire: (key, seconds) => redis.expire(`${prefix}${key}`, seconds),
        exists: (key) => redis.exists(`${prefix}${key}`),
        // Proxy for direct access when prefixing is handled elsewhere
        client: redis
    };
};

export default redis;
