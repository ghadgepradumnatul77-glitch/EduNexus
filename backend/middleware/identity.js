import { query, platformQuery } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Enterprise Custom Domain & Subdomain Resolver
 * This middleware extracts the Host header and maps it to a tenant context.
 */
export const resolveTenantIdentity = async (req, res, next) => {
    const host = req.headers.host;
    if (!host) return next();

    try {
        // 1. Check Cache (Only if Redis is connected)
        if (redis.status === 'ready') {
            const cacheKey = `identity:resolve:${host}`;
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);
                    req.tenantId = data.organization_id;
                    req.tenantSlug = data.slug;
                    return next();
                }
            } catch (err) {
                console.warn('⚠️ Redis resolve error, falling back to DB:', err.message);
            }
        }

        // 2. Identify if it's a Subdomain or Custom Domain
        const parts = host.split('.');

        // Filter out localhost and dev domains for lookup if not needed
        // But for development, oxford.lvh.me or similar might be used

        // 3. Subdomain Lookup
        if (host.endsWith('.edunexus.com') || host.endsWith('.lvh.me')) {
            const slug = parts[0];
            const result = await platformQuery(
                'SELECT id, slug FROM organizations WHERE slug = $1 AND status = $2',
                [slug, 'active']
            );

            if (result.rows.length > 0) {
                const org = result.rows[0];
                req.tenantId = org.id;
                req.tenantSlug = org.slug;

                // Attempt to cache
                if (redis.status === 'ready') {
                    const cacheKey = `identity:resolve:${host}`;
                    await redis.set(cacheKey, JSON.stringify({ organization_id: org.id, slug: org.slug }), 'EX', 3600)
                        .catch(e => console.error('Redis cache set error:', e.message));
                }
                return next();
            }
        }

        // 4. Custom Domain Lookup
        const domainResult = await platformQuery(
            `SELECT d.organization_id, o.slug 
             FROM organization_domains d
             JOIN organizations o ON d.organization_id = o.id
             WHERE d.domain = $1 AND d.is_verified = TRUE AND o.status = 'active'`,
            [host]
        );

        if (domainResult.rows.length > 0) {
            const org = domainResult.rows[0];
            req.tenantId = org.organization_id;
            req.tenantSlug = org.slug;

            if (redis.status === 'ready') {
                const cacheKey = `identity:resolve:${host}`;
                await redis.set(cacheKey, JSON.stringify({ organization_id: org.organization_id, slug: org.slug }), 'EX', 3600)
                    .catch(e => console.error('Redis cache set error:', e.message));
            }
            return next();
        }

        next();
    } catch (error) {
        console.error('Identity resolution fatal error:', error);
        next();
    }
};
