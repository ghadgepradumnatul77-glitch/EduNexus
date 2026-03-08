import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
    // 1. PRODUCTION GUARD (Hard Fail-Safe)
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ SEED ABORTED: Cannot run seed scripts in PRODUCTION environment.');
        process.exit(1);
    }

    try {
        console.log('🌱 Seeding EduNexus Hardened V2 Environment...');

        // Read V2 seed file
        const seedPath = path.join(__dirname, 'seed_v2.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');

        // Execute seed
        await pool.query(seed);

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
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

runSeed();
