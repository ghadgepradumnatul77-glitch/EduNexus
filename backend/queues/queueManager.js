import { Queue } from 'bullmq';
import { fileURLToPath } from 'url';
import path from 'path';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

// 1. Audit Log Queue
export const auditQueue = new Queue('audit-logs', { connection: redisConfig });

// 2. Metrics & Usage Queue
export const usageQueue = new Queue('tenant-usage', { connection: redisConfig });

// 3. Notification & Webhook Queue
export const notificationQueue = new Queue('notifications', { connection: redisConfig });

/**
 * Helper to add audit logs to the queue
 */
export const queueAuditLog = async (logData) => {
    await auditQueue.add('log', logData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false
    });
};
