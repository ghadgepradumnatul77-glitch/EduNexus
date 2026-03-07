import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

const STREAM_NAME = 'edunexus_events';
const GROUP_NAME = 'api_consumers';
const CONSUMER_NAME = `usage_worker_${process.pid}`;

/**
 * SaaS Usage Worker
 * Pulls usage.tracked events from Redis Streams and updates organization summaries.
 */
export const startUsageWorker = async () => {
    console.log(`🚀 Usage Worker [${CONSUMER_NAME}] started...`);

    while (true) {
        try {
            // Check connectivity
            if (redis.status !== 'ready') {
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
            const results = await redis.xreadgroup(
                'GROUP', GROUP_NAME, CONSUMER_NAME,
                'COUNT', 100,
                'BLOCK', 5000,
                'STREAMS', STREAM_NAME, '>'
            );

            if (!results) continue;

            const [stream, entries] = results[0];
            const ids = [];

            for (const [id, fields] of entries) {
                const data = {};
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1];
                }

                if (data.eventType === 'usage.tracked') {
                    const usage = JSON.parse(data.data);

                    // Atomic update to organization usage summary
                    // This handles near-real-time quota enforcement
                    await updateOrganizationUsage(data.tenantId, usage.metric, usage.value);

                    // Also log to audit/time-series if needed
                    await logHistoricalUsage(data.tenantId, usage.metric, usage.value);
                }
                ids.push(id);
            }

            if (ids.length > 0) {
                await redis.xack(STREAM_NAME, GROUP_NAME, ...ids);
            }

        } catch (error) {
            console.error('Usage Worker Error:', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

async function updateOrganizationUsage(orgId, metric, value) {
    if (!orgId || orgId === 'system') return;

    let updateSql = '';
    if (metric === 'users') {
        updateSql = 'UPDATE organization_usage SET current_user_count = current_user_count + $1 WHERE organization_id = $2';
    } else if (metric === 'storage') {
        updateSql = 'UPDATE organization_usage SET current_storage_bytes = current_storage_bytes + $1 WHERE organization_id = $2';
    } else {
        return; // Unknown metric
    }

    await query(updateSql, [value, orgId]);
}

async function logHistoricalUsage(orgId, metric, value) {
    if (!orgId || orgId === 'system') return;

    await query(
        `INSERT INTO tenant_usage_metrics (organization_id, metric_key, value) 
         VALUES ($1, $2, $3)`,
        [orgId, metric, value]
    );
}
