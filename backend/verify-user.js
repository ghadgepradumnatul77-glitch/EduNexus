import { platformQuery } from './db/connection.js';
import './config/env.js';

async function verify() {
    const email = 'pradumnghadge121@gmail.com';
    console.log(`🔍 Verifying state for: ${email}`);

    try {
        const result = await platformQuery(
            'SELECT id, email, organization_id, failed_attempts, locked_until FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found.');
            const anyUsers = await platformQuery('SELECT email FROM users LIMIT 5');
            console.log('📝 Existing users:', anyUsers.rows.map(r => r.email));
        } else {
            console.log('✅ User state:', result.rows[0]);

            if (!result.rows[0].organization_id) {
                console.log('⚠️ No organization_id assigned. Finding one...');
                const orgs = await platformQuery('SELECT id FROM organizations LIMIT 1');
                if (orgs.rows.length > 0) {
                    await platformQuery('UPDATE users SET organization_id = $1 WHERE id = $2', [orgs.rows[0].id, result.rows[0].id]);
                    console.log('✅ Assigned user to org:', orgs.rows[0].id);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

verify();
