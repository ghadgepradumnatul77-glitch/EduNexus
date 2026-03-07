import pg from 'pg';
import './backend/config/env.js';
import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'edunexus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function verifyState() {
    const email = 'pradumnghadge121@gmail.com';
    console.log(`🔍 Verifying state for: ${email}`);

    try {
        const userRes = await pool.query(
            'SELECT id, email, organization_id, failed_attempts, locked_until FROM users WHERE email = $1',
            [email]
        );

        if (userRes.rows.length === 0) {
            console.log('❌ User NOT found. Seeding required?');
            const orgs = await pool.query('SELECT id, name FROM organizations LIMIT 1');
            if (orgs.rows.length === 0) {
                console.log('⚠️ No organizations found. Must seed first.');
            } else {
                console.log(`💡 Suggestion: Create user and assign to org: ${orgs.rows[0].id}`);
            }
        } else {
            const user = userRes.rows[0];
            console.log('✅ User found:', user);

            if (!user.organization_id) {
                console.log('⚠️ User lacks organization_id! Fixing...');
                const orgs = await pool.query('SELECT id FROM organizations LIMIT 1');
                if (orgs.rows.length > 0) {
                    await pool.query('UPDATE users SET organization_id = $1 WHERE id = $2', [orgs.rows[0].id, user.id]);
                    console.log(`✅ Set organization_id to: ${orgs.rows[0].id}`);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

verifyState();
