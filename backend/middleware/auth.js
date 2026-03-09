import jwt from 'jsonwebtoken';
import { query, platformQuery } from '../db/connection.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // Strictly retrieve token from HTTP-only cookie
        const token = req.cookies?.app_session_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No session found.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Get user from database (Identity lookup must bypass RLS to find the tenant)
        const result = await platformQuery(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id, u.is_deleted, r.name as role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.is_deleted = FALSE`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request
        req.user = {
            id: result.rows[0].id,
            email: result.rows[0].email,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            role: result.rows[0].role,
            tenantId: result.rows[0].tenant_id
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

// Role-based access control
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Optional auth (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];

        if (!token && req.cookies?.app_session_token) {
            token = req.cookies.app_session_token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const result = await platformQuery(
                `SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id, r.name as role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1 AND u.is_deleted = FALSE`,
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                req.user = {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    firstName: result.rows[0].first_name,
                    lastName: result.rows[0].last_name,
                    role: result.rows[0].role
                };
            }
        }

        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

/**
 * Hardened Platform Admin Middleware
 * Verifies tokens explicitly issued for the platform control plane.
 */
export const requirePlatformAdmin = async (req, res, next) => {
    try {
        const token = req.cookies?.infra_session_token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Platform access required. Please login.' });
        }

        const decoded = jwt.verify(token, process.env.PLATFORM_JWT_SECRET);

        if (decoded.type !== 'platform') {
            return res.status(403).json({ success: false, message: 'Invalid platform credential type.' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired platform session.' });
    }
};
