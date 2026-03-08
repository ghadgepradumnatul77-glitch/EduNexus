import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
    // 1. PRODUCTION GUARD (Hard Fail-Safe)
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
        console.error('❌ SEED ABORTED: Cannot run seed scripts in PRODUCTION environment without ALLOW_PROD_SEED=true.');
        process.exit(1);
    }

    try {
        console.log('🌱 Seeding EduNexus Hardened V2 Environment...');

        // Read V2 seed file
        const seedPath = path.join(__dirname, 'seed_v2.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');

        // Execute seed with superadmin bypass
        const client = await pool.connect();
        try {
            await client.query("SELECT set_config('app.is_superadmin', 'true', true)");
            await client.query(seed);
        } finally {
            client.release();
        }

        console.log('✅ Database seeded successfully');
        console.log('\n🔐 IDENTITY DIRECTORY (SANDBOX)');
        console.log('--------------------------------------------------');
        console.log('🚀 PLATFORM PORTAL (Infrastructure Control Plane)');
        console.log('   Operator: ops@edunexus.infra / EduNexus!Ops#2026');
        console.log('\n🏢 UNIVERSITY PORTAL (ERP Sandbox)');
        console.log('   Admin:    admin@demo.edu / Demo@123');
        console.log('   Faculty:  faculty@demo.edu / Demo@123');
        console.log('   Student:  student@demo.edu / Demo@123');
        console.log('--------------------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ [SEED] Fatal Error during seeding:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

runSeed();
