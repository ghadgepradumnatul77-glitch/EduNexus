import { query } from '../db/connection.js';
import redis from '../config/redis.js';
import { auditQueue } from '../queues/queueManager.js';

/**
 * Liveness Check (Shallow)
 * Indicates the process is alive.
 */
export const livenessCheck = (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
};

/**
 * Readiness Check (Deep)
 * Checks connectivity to DB, Redis, and Job Queues.
 */
export const readinessCheck = async (req, res) => {
    const checks = {
        database: false,
        redis: false,
        queues: false
    };

    try {
        // 1. DB Ping
        await query('SELECT 1');
        checks.database = true;

        // 2. Redis Ping (Soft Check)
        try {
            const redisPong = await redis.ping();
            if (redisPong === 'PONG') checks.redis = true;
        } catch (e) {
            console.warn('⚠️ Readiness check: Redis skipped (Optional for API)');
            checks.redis = true; // Still marked as true to allow API startup
        }

        // 3. Queue Health (Soft Check)
        try {
            const jobCount = await auditQueue.getJobCounts();
            if (jobCount) checks.queues = true;
        } catch (e) {
            console.warn('⚠️ Readiness check: Queues skipped (Optional for API)');
            checks.queues = true;
        }

        const isReady = checks.database; // Database is the only hard dependency for API

        res.status(isReady ? 200 : 503).json({
            status: isReady ? 'READY' : 'NOT_READY',
            checks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'DOWN',
            checks,
            error: process.env.NODE_ENV === 'production' ? 'Infra connectivity failure' : error.message
        });
    }
};

/**
 * Tenant Health Check
 * Verifies if a specific tenant exists and is active.
 */
export const tenantHealthCheck = async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await query(
            'SELECT id, name, status FROM organizations WHERE slug = $1 AND is_deleted = FALSE',
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        res.json({
            success: true,
            tenant: result.rows[0].name,
            status: result.rows[0].status
        });
    } catch (error) {
        console.error('Tenant health check error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
