import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function setupTestDb() {
    const dbName = 'edunexus_test';

    // Connect to 'postgres' to manage databases
    const adminClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres',
    });

    try {
        await adminClient.connect();

        // Drop database if exists
        console.log(`Dropping database '${dbName}' if exists...`);
        await adminClient.query(`DROP DATABASE IF EXISTS ${dbName}`);

        // Create database
        console.log(`Creating database '${dbName}'...`);
        await adminClient.query(`CREATE DATABASE ${dbName}`);

        await adminClient.end();

        // Connect to the new test database
        const testClient = new Client({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: dbName,
        });

        await testClient.connect();
        console.log(`Connected to '${dbName}'. Running schema...`);

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await testClient.query(schemaSql);
        console.log('✅ Schema executed successfully.');

        // Read and execute seed.sql
        const seedPath = path.join(__dirname, 'seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await testClient.query(seedSql);
        console.log('✅ Seed data inserted successfully.');

        await testClient.end();
        console.log('🚀 Test database setup complete.');
    } catch (err) {
        console.error('❌ Error setting up test database:', err.message);
        process.exit(1);
    }
}

setupTestDb();
