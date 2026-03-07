import { query } from '../db/connection.js';
import redis from '../utils/redis.js';

const STREAM_NAME = 'edunexus_events';
const GROUP_NAME = 'api_consumers';
const CONSUMER_NAME = `telemetry_worker_${process.pid}`;

/**
 * SaaS Telemetry Worker
 * Processes 'product.telemetry' events.
 */
export const startTelemetryWorker = async () => {
    console.log(`🚀 Telemetry Worker [${CONSUMER_NAME}] started...`);

    while (true) {
        try {
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

                if (data.eventType === 'product.telemetry') {
                    const payload = JSON.parse(data.data);

                    // 1. Persist Raw Event
                    await query(
                        `INSERT INTO product_events (organization_id, user_id, event_key, event_type, metadata)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [data.tenantId === 'system' ? null : data.tenantId, payload.userId, payload.eventKey, payload.eventType, JSON.stringify(payload.metadata)]
                    );

                    // 2. Track "First Value" Milestone (Aha! Moment)
                    // If this is the FIRST time they do a core action, timestamp it for TTO analysis
                    if (payload.eventType === 'milestone') {
                        await query(
                            `UPDATE organizations SET first_value_at = $1 
                             WHERE id = $2 AND first_value_at IS NULL`,
                            [payload.timestamp, data.tenantId]
                        );
                    }
                }
                ids.push(id);
            }

            if (ids.length > 0) {
                await redis.xack(STREAM_NAME, GROUP_NAME, ...ids);
            }

        } catch (error) {
            console.error('Telemetry Worker Error:', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
