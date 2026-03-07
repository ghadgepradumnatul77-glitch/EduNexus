import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, platformQuery, withTenantContext } from '../db/connection.js';
import { logAudit } from '../services/audit.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const ACCOUNT_LOCK_DURATION = 5 * 60 * 1000; // 5 minutes (Requested)

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId, version: '2' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId, jti: crypto.randomBytes(16).toString('hex') },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const setCsrfCookie = (res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('xsrf-token', csrfToken, {
        httpOnly: false, // Must be accessible by client for Double-Submit
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // Match Refresh Token expiry
    });
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const userResult = await platformQuery(
            `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
                    u.failed_attempts, u.locked_until, u.is_deleted, u.organization_id,
                    r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];

        // 1. Tenant Suspension Check (Platform Level)
        const orgResult = await platformQuery(
            'SELECT status, suspension_reason FROM organizations WHERE id = $1',
            [user.organization_id]
        );
        if (orgResult.rows[0]?.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: `Your organization has been suspended. Reason: ${orgResult.rows[0].suspension_reason || 'Administrative hold'}`
            });
        }

        if (user.is_deleted) {
            return res.status(401).json({ success: false, message: 'Account deactivated.' });
        }

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(423).json({
                success: false,
                message: 'Account locked for security reasons. Please try again after 5 minutes.'
            });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            const newFailedAttempts = (user.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
                lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION);
                // Forensic logging
                logAudit(req, {
                    action: 'ACCOUNT_LOCK_EVENT',
                    entityType: 'USER',
                    entityId: user.id,
                    success: false
                });
            }

            await platformQuery(
                'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
                [newFailedAttempts, lockedUntil, user.id]
            );

            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Success
        await platformQuery(
            'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1 WHERE id = $2',
            [ipAddress, user.id]
        );

        const { accessToken, refreshToken } = generateTokens(user.id);
        const tokenHash = hashToken(refreshToken);
        const familyId = crypto.randomUUID();

        await platformQuery(
            'INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, ip_address, user_agent, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [user.id, familyId, tokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress, req.get('user-agent'), user.organization_id]
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        setCsrfCookie(res);

        res.json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, firstName: user.first_name, role: user.role, orgId: user.organization_id }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

export const refreshToken = async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) return res.status(401).json({ success: false, message: 'No refresh token.' });

    try {
        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
        const tokenHash = hashToken(oldRefreshToken);

        const tokenResult = await platformQuery(
            'SELECT * FROM refresh_tokens WHERE token_hash = $1',
            [tokenHash]
        );

        const storedToken = tokenResult.rows[0];

        // 1. Tenant Suspension Check (Platform Level)
        const orgResult = await platformQuery(
            'SELECT status, suspension_reason FROM organizations WHERE id = $1',
            [storedToken.organization_id]
        );
        if (orgResult.rows[0]?.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: `Session blocked: Organization is suspended. Reason: ${orgResult.rows[0].suspension_reason || 'Administrative hold'}`
            });
        }

        // REUSE DETECTION: If token is already revoked, revoke the ENTIRE family.
        if (!storedToken || storedToken.revoked) {
            if (storedToken) {
                await platformQuery('UPDATE refresh_tokens SET revoked = TRUE WHERE family_id = $1', [storedToken.family_id]);
                logAudit(req, {
                    action: 'TOKEN_REUSE_DETECTED',
                    entityType: 'REFRESH_TOKEN',
                    entityId: storedToken.id,
                    success: false
                });
            }
            return res.status(401).json({ success: false, message: 'Security breach detected. Sessions revoked.' });
        }

        // Rotate
        await platformQuery('UPDATE refresh_tokens SET revoked = TRUE, replaced_by_token_id = $1 WHERE id = $2', [storedToken.id, storedToken.id]);

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
        const newTokenHash = hashToken(newRefreshToken);

        const insertResult = await platformQuery(
            'INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, ip_address, user_agent, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [decoded.userId, storedToken.family_id, newTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), req.ip, req.get('user-agent'), storedToken.organization_id]
        );

        await platformQuery('UPDATE refresh_tokens SET replaced_by_token_id = $1 WHERE id = $2', [insertResult.rows[0].id, storedToken.id]);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        setCsrfCookie(res);

        res.json({ success: true, message: 'Token rotated.' });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid session.' });
    }
};

export const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
        const tokenHash = hashToken(token);
        await platformQuery('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out.' });
};

export const getCurrentUser = async (req, res) => {
    try {
        const result = await platformQuery(
            `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, u.organization_id as "orgId"
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1 AND u.is_deleted = FALSE`,
            [req.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal error.' });
    }
};
