import bcrypt from 'bcrypt';
import { platformQuery } from '../db/connection.js';

async function provisionPlatformAdmin() {
    const email = 'platform.admin@edunexus.io';
    const password = 'NexusEnterprise2026!';
    const hash = await bcrypt.hash(password, 12);

    try {
        await platformQuery(
            'INSERT INTO platform_admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
            [email, hash]
        );
        console.log('✅ Platform Admin provisioned successfully');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (error) {
        console.error('❌ Provisioning failed:', error);
    } finally {
        process.exit(0);
    }
}

provisionPlatformAdmin();
