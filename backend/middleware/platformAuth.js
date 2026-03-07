import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';

export const verifyPlatformToken = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];

        if (!token && req.cookies?.platformAccessToken) {
            token = req.cookies.platformAccessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Platform access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.PLATFORM_JWT_SECRET);

        const result = await query(
            'SELECT id, email, is_active FROM platform_admins WHERE id = $1 AND is_active = TRUE',
            [decoded.adminId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid platform token.'
            });
        }

        req.platformAdmin = result.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired platform token.'
        });
    }
};
