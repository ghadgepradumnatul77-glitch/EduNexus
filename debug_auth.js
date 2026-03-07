import pg from 'pg';
import './backend/config/env.js';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'edunexus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function checkState() {
    const email = 'pradumnghadge121@gmail.com';
    console.log(`🔍 Checking state for email: ${email}`);

    try {
        const userResult = await pool.query(
            `SELECT u.id, u.email, u.failed_attempts, u.locked_until, u.organization_id, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User not found.');
        } else {
            console.log('✅ User found:', userResult.rows[0]);
        }

        const orgs = await pool.query('SELECT id, name, slug, status FROM organizations');
        console.log('📊 Organizations:', orgs.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkState();
