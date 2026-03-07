import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import '../backend/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Client } = pg;

const BACKUP_DIR = path.join(__dirname, '../backups');

async function verifyLatestBackup() {
    console.log('🏁 Starting Enterprise Backup Verification...');

    // 1. Find latest backup
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);

    if (files.length === 0) {
        console.error('❌ No backup files found in:', BACKUP_DIR);
        process.exit(1);
    }

    const latest = files[0];
    const latestPath = path.join(BACKUP_DIR, latest);
    const testDbName = `edunexus_verify_${Date.now()}`;

    console.log(`📦 Testing backup: ${latest}`);

    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

    try {
        // 2. Create temporary database
        console.log(`🔨 Creating temporary test DB: ${testDbName}`);
        execSync(`createdb -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${testDbName}`, { env });

        // 3. Restore backup
        console.log('🔄 Attempting restore...');
        execSync(`psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${testDbName} -f "${latestPath}"`, { env, stdio: 'ignore' });

        // 4. Verify data integrity
        console.log('🧪 Running data integrity checks...');
        const client = new Client({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: testDbName
        });
        await client.connect();

        const orgCount = await client.query('SELECT COUNT(*) FROM organizations');
        const userCount = await client.query('SELECT COUNT(*) FROM users');

        console.log(`📊 Integrity Check Passed: ${orgCount.rows[0].count} Organizations, ${userCount.rows[0].count} Users recovered.`);

        await client.end();
        console.log('✅ BACKUP INTEGRITY VERIFIED (PASS)');

    } catch (error) {
        console.error('❌ BACKUP VERIFICATION FAILED!');
        console.error(error.message);
        process.exit(1);
    } finally {
        // 5. Cleanup
        try {
            console.log(`🧹 Dropping temporary test DB: ${testDbName}`);
            execSync(`dropdb -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ${testDbName}`, { env });
        } catch (e) {
            console.warn('⚠️ Manual cleanup of test DB may be required:', testDbName);
        }
    }
}

verifyLatestBackup();
