import { logAudit } from '../services/audit.js';

/**
 * Hardened Double-Submit Cookie CSRF Protection
 * 1. Client receives 'xsrf-token' in a non-httpOnly cookie.
 * 2. Client sends this token back in 'X-XSRF-TOKEN' header for state-changing requests.
 * 3. Server compares cookie value with header value.
 */
export const csrfProtection = (req, res, next) => {
    // 1. Only protect state-changing methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // 1b. Exclude Login Route (Chicken-and-egg problem: cookie is set AFTER login)
    if (req.path === '/api/auth/login' || req.path === '/api/platform/login') {
        return next();
    }

    // 2. Validate Origin/Referer (Strict Origin Check)
    const origin = req.get('origin');
    const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

    if (origin && origin !== allowedOrigin) {
        logAudit(req, {
            action: 'CSRF_FAILURE',
            entityType: 'NETWORK',
            entityId: null,
            success: false,
            before_state: { reason: 'Origin mismatch', origin, allowedOrigin }
        });
        return res.status(403).json({ success: false, message: 'CSRF: Origin Mismatch.' });
    }

    // 3. Double-Submit Check
    const cookieToken = req.cookies['xsrf-token'];
    const headerToken = req.get('X-XSRF-TOKEN');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        logAudit(req, {
            action: 'CSRF_FAILURE',
            entityType: 'AUTH',
            entityId: req.user?.id || null,
            success: false,
            before_state: {
                hasCookie: !!cookieToken,
                hasHeader: !!headerToken,
                mismatch: cookieToken !== headerToken
            }
        });
        return res.status(403).json({
            success: false,
            message: 'CSRF Protection: Token validation failed.'
        });
    }

    next();
};
