import bcrypt from 'bcrypt';
import { platformQuery } from './db/connection.js';
import './config/env.js';

async function testLockout() {
    const email = 'pradumnghadge121@gmail.com';
    console.log(`🧪 Testing lockout for: ${email}`);

    try {
        // 1. Reset user state
        console.log('🧹 Resetting failed_attempts and locked_until...');
        await platformQuery(
            'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = $1',
            [email]
        );

        // 2. Simulate 5 failed attempts (assuming MAX_LOGIN_ATTEMPTS is 5)
        for (let i = 1; i <= 5; i++) {
            console.log(`💥 Attempt ${i}...`);
            const userRes = await platformQuery('SELECT id, failed_attempts FROM users WHERE email = $1', [email]);
            const user = userRes.rows[0];
            const newAttempts = user.failed_attempts + 1;
            let lockedUntil = null;

            if (newAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
            }

            await platformQuery(
                'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
                [newAttempts, lockedUntil, user.id]
            );
        }

        // 3. Verify final state
        const finalRes = await platformQuery(
            'SELECT failed_attempts, locked_until FROM users WHERE email = $1',
            [email]
        );
        const finalUser = finalRes.rows[0];

        console.log('📊 Final State:', {
            failed_attempts: finalUser.failed_attempts,
            locked_until: finalUser.locked_until
        });

        if (finalUser.failed_attempts === 5 && finalUser.locked_until) {
            console.log('✅ LOCKOUT SUCCESSFUL');
        } else {
            console.log('❌ LOCKOUT FAILED');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

testLockout();
