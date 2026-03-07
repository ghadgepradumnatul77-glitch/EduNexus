import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

/**
 * Tenant Resolution Middleware
 * Resolves organization from subdomain and sets context.
 */
export const resolveTenant = async (req, res, next) => {
    // 1. Skip for static assets or non-API routes if necessary
    if (req.path.startsWith('/health')) return next();

    try {
        // 2. Extract subdomain
        const host = req.headers.host; // e.g., oxford.edunexus.com
        const parts = host.split('.');

        // In local dev, we might use org1.localhost:5000
        // In production, we expect subdomain.domain.com
        let slug = parts.length >= 2 ? parts[0] : null;

        // Optional: Bypass for root domain or specific IP access
        if (slug === 'localhost' || slug === 'www' || !slug) {
            req.tenantId = null;
            req.isPlatformAccess = true;
            return next();
        }

        // 3. Resolve Tenant ID (Check Cache First)
        let tenantData = await redis.get(`tenant:slug:${slug}`);

        if (!tenantData) {
            const result = await query(
                'SELECT id, status FROM organizations WHERE slug = $1 AND is_deleted = FALSE',
                [slug]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Tenant '${slug}' not found.`
                });
            }

            tenantData = JSON.stringify(result.rows[0]);
            // Cache for 1 hour
            await redis.set(`tenant:slug:${slug}`, tenantData, 'EX', 3600);
        }

        const tenant = JSON.parse(tenantData);

        if (tenant.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This organization account is suspended or deactivated.'
            });
        }

        // 4. Attach context
        req.tenantId = tenant.id;
        req.tenantSlug = slug;

        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ success: false, message: 'Internal server error resolving tenant.' });
    }
};
