import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
    try {
        console.log('🌱 Seeding database...');

        // Read seed file
        const seedPath = path.join(__dirname, 'seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');

        // Execute seed
        await pool.query(seed);

        console.log('✅ Database seeded successfully');
        console.log('\n📧 Default Admin Credentials:');
        console.log('   Email: admin@edunexus.com');
        console.log('   Password: Admin@123');
        console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

runSeed();
