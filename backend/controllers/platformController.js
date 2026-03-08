import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { platformQuery } from '../db/connection.js';

const setCsrfCookie = (res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('xsrf-token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 3600000 // 1 hour
    });
};

export const platformLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[PLATFORM-AUTH] Login attempt for: ${email}`);

    try {
        const result = await platformQuery(
            'SELECT id, password_hash, is_active, force_password_change FROM platform_admins WHERE email = $1',
            [email]
        );

        const admin = result.rows[0];
        if (!admin || !admin.is_active) {
            console.warn(`[PLATFORM-AUTH] Admin not found or inactive: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
        }

        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) {
            console.warn(`[PLATFORM-AUTH] Password mismatch for: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const accessToken = jwt.sign(
            { adminId: admin.id, type: 'platform' },
            process.env.PLATFORM_JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log(`[PLATFORM-AUTH] Login successful for: ${email}. Building session.`);

        res.cookie('platformAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour
        });

        setCsrfCookie(res);

        res.json({
            success: true,
            data: {
                id: admin.id,
                email,
                forcePasswordChange: admin.force_password_change
            }
        });
    } catch (error) {
        console.error('Platform login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const changePlatformPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.adminId;

    try {
        const result = await platformQuery(
            'SELECT password_hash FROM platform_admins WHERE id = $1',
            [adminId]
        );

        const admin = result.rows[0];
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

        const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid current password.' });

        const newHash = await bcrypt.hash(newPassword, 12);
        await platformQuery(
            'UPDATE platform_admins SET password_hash = $1, force_password_change = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newHash, adminId]
        );

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating password.' });
    }
};

export const getTenants = async (req, res) => {
    try {
        const result = await platformQuery(
            'SELECT id, name, slug, status, created_at FROM organizations WHERE is_deleted = FALSE ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenants' });
    }
};

export const updateTenantStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    try {
        await platformQuery(
            'UPDATE organizations SET status = $1, suspension_reason = $2, suspended_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
            [status, reason || null, status === 'suspended' ? new Date() : null, id]
        );
        res.json({ success: true, message: `Tenant status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating tenant status' });
    }
};

export const deleteTenant = async (req, res) => {
    const { id } = req.params;

    try {
        await platformQuery('UPDATE organizations SET is_deleted = TRUE, status = $1, deleted_at = CURRENT_TIMESTAMP WHERE id = $2', ['deactivated', id]);
        res.json({ success: true, message: 'Tenant marked as deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting tenant' });
    }
};
