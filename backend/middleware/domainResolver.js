import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Custom Domain Resolution Middleware
 * Checks if the current Host header matches a registered custom domain.
 */
export const resolveCustomDomain = async (req, res, next) => {
    if (req.tenantId) return next(); // Already resolved via subdomain

    const host = req.headers.host;

    // Skip if it looks like a subdomain of our primary domain
    // (This logic should be refined based on the primary domain setting)
    if (host.endsWith('.edunexus.com') || host === 'edunexus.com') {
        return next();
    }

    try {
        const cacheKey = `domain:resolve:${host}`;
        let orgData = await redis.get(cacheKey);

        if (!orgData) {
            const result = await query(
                `SELECT d.organization_id, o.status 
         FROM organization_domains d
         JOIN organizations o ON d.organization_id = o.id
         WHERE d.domain = $1 AND d.is_verified = TRUE`,
                [host]
            );

            if (result.rows.length > 0) {
                orgData = JSON.stringify(result.rows[0]);
                await redis.set(cacheKey, orgData, 'EX', 3600); // 1 hour cache
            } else {
                return next(); // Not a known custom domain
            }
        }

        const org = JSON.parse(orgData);

        if (org.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This organization account is suspended or deactivated.'
            });
        }

        req.tenantId = org.organization_id;
        next();
    } catch (error) {
        console.error('Custom domain resolution error:', error);
        next();
    }
};
