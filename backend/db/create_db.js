import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function createDatabase() {
    // Connect to the default 'postgres' database to create the new one
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres', // Connect to default DB
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL (postgres database)');

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'edunexus'");
        if (res.rowCount === 0) {
            console.log("Creating database 'edunexus'...");
            await client.query('CREATE DATABASE edunexus');
            console.log("✅ Database 'edunexus' created successfully.");
        } else {
            console.log("Database 'edunexus' already exists.");
        }
    } catch (err) {
        console.error('❌ Error creating database:', err.message);
        console.log('Please ensure your DB_PASSWORD in .env is correct and PostgreSQL is running.');
    } finally {
        await client.end();
    }
}

createDatabase();
