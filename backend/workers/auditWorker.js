import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

const STREAM_NAME = 'edunexus_events';
const GROUP_NAME = 'api_consumers';
const CONSUMER_NAME = `worker_${process.pid}`;

/**
 * SaaS Audit Worker
 * Pulls audit.logged events from Redis Streams and batch-inserts into Postgres.
 */
export const startAuditWorker = async () => {
    console.log(`🚀 Audit Worker [${CONSUMER_NAME}] started...`);

    while (true) {
        try {
            // Check connectivity
            if (redis.status !== 'ready') {
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
            // Read up to 100 events
            // BLOCK 5000 means wait up to 5s for new events
            // ">" means only new events for this group
            const results = await redis.xreadgroup(
                'GROUP', GROUP_NAME, CONSUMER_NAME,
                'COUNT', 100,
                'BLOCK', 5000,
                'STREAMS', STREAM_NAME, '>'
            );

            if (!results) continue;

            const [stream, entries] = results[0];
            const batch = [];
            const ids = [];

            for (const [id, fields] of entries) {
                // Parse fields array to object
                const data = {};
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1];
                }

                if (data.eventType === 'audit.logged') {
                    const log = JSON.parse(data.data);
                    batch.push([
                        data.tenantId === 'system' ? null : data.tenantId, // Assuming organization_id
                        log.userId,
                        log.action,
                        log.entityType,
                        log.entityId,
                        log.ipAddress,
                        log.userAgent,
                        JSON.stringify(log.details)
                    ]);
                    ids.push(id);
                }
            }

            if (batch.length > 0) {
                // Perform Bulk Insert
                // We'll use a transaction for safety
                await performBulkInsert(batch);

                // ACK the messages
                await redis.xack(STREAM_NAME, GROUP_NAME, ...ids);
                console.log(`✅ Batched ${batch.length} audit logs.`);
            }

        } catch (error) {
            console.error('Audit Worker Error:', error);
            // Wait a bit before retrying on error
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

/**
 * Perform efficient bulk insert into audit_logs table
 */
async function performBulkInsert(batch) {
    const values = [];
    const placeholders = [];

    batch.forEach((row, i) => {
        const offset = i * 8;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(...row);
    });

    const sql = `
        INSERT INTO audit_logs 
        (organization_id, user_id, action, entity_type, entity_id, ip_address, user_agent, details)
        VALUES ${placeholders.join(', ')}
    `;

    await query(sql, values);
}
