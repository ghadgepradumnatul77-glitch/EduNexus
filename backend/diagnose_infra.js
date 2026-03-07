import { query } from './db/connection.js';
import redis from './config/redis.js';

async function diagnose() {
    console.log('🧪 Starting Infrastructure Diagnostics...');

    // 1. DB Test
    try {
        console.log('📡 Testing Database...');
        await query('SELECT 1');
        console.log('✅ Database: OK');
    } catch (err) {
        console.error('❌ Database: FAILED', err.message);
    }

    // 2. Redis Test
    try {
        console.log('📡 Testing Redis...');
        const pong = await redis.ping();
        console.log('✅ Redis:', pong);
    } catch (err) {
        console.error('❌ Redis: FAILED', err.message);
    }

    process.exit(0);
}

diagnose();
