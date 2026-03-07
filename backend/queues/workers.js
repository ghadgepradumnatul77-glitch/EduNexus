import { Worker } from 'bullmq';
import { query } from '../db/connection.js';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

// 1. Audit Log Worker
const auditWorker = new Worker('audit-logs', async (job) => {
    const {
        actor_id, actor_role, organization_id, action_type,
        entity_type, entity_id, before_state, after_state,
        ip_address, user_agent, request_id, success
    } = job.data;

    try {
        await query(
            `INSERT INTO audit_logs (
                actor_id, actor_role, organization_id, action_type, 
                entity_type, entity_id, before_state, after_state, 
                ip_address, user_agent, request_id, success
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                actor_id, actor_role, organization_id, action_type,
                entity_type, entity_id, before_state, after_state,
                ip_address, user_agent, request_id, success
            ]
        );
    } catch (err) {
        console.error(`Audit Worker Fail [Job ${job.id}]:`, err);
        throw err; // Allow BullMQ to retry
    }
}, { connection: redisConfig });

// 2. Usage Tracking Worker
const usageWorker = new Worker('tenant-usage', async (job) => {
    const { orgId, type } = job.data;
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
        if (type === 'api_call') {
            await query(
                `INSERT INTO organization_usage (organization_id, month, api_calls)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (organization_id, month)
                 DO UPDATE SET api_calls = organization_usage.api_calls + 1, updated_at = CURRENT_TIMESTAMP`,
                [orgId, month]
            );
        }
    } catch (err) {
        console.error(`Usage Worker Fail [Job ${job.id}]:`, err);
    }
}, { connection: redisConfig });

console.log('✅ Background workers initialized successfully');

export default { auditWorker, usageWorker };
