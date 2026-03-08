import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🚀 Running database migrations...');
        if (process.env.DATABASE_URL) {
            console.log('📡 Connection: DATABASE_URL detected (Render standard)');
        } else {
            console.log(`📡 Target: ${process.env.DB_HOST || 'localhost'} | User: ${process.env.DB_USER || 'postgres'} | DB: ${process.env.DB_NAME || 'edunexus'}`);
        }

        if (process.env.NODE_ENV === 'production') {
            console.log('🔒 SSL: Enabled (Managed Database Connection)');
        }

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);
        console.log('✅ Core database schema created successfully');

        // Run migrations from directory
        const migrationsDir = path.join(__dirname, 'migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
            for (const file of migrationFiles) {
                console.log(`🚀 Running migration: ${file}...`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                await pool.query(sql);
                console.log(`✅ Completed: ${file}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
