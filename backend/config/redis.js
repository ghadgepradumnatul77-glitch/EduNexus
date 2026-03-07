import redis, { cacheGet, cacheSet, getScopedRedis, isRedisConnected } from '../utils/redis.js';

/**
 * COMPATIBILITY LAYER
 * Consolidated into utils/redis.js. Please use utils/redis.js directly for new code.
 */
export { cacheGet, cacheSet, getScopedRedis, isRedisConnected };
export default redis;
