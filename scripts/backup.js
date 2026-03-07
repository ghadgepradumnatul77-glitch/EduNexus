import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import '../backend/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `edunexus_backup_${timestamp}.sql`;
const filePath = path.join(BACKUP_DIR, filename);

// Note: Requires pg_dump to be in the system PATH
const command = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -F p -f "${filePath}"`;

console.log(`🚀 Starting backup: ${filename}...`);

const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

exec(command, { env }, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        return;
    }
    if (stderr) {
        console.warn(`⚠️ Warning: ${stderr}`);
    }
    console.log(`✅ Backup completed successfully: ${filePath}`);

    // retention logic (7 days)
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    files.forEach(file => {
        const fullPath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted old backup: ${file}`);
        }
    });
});
