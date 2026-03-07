import request from 'supertest';
import app from '../server.js';
import { query, default as pool } from '../db/connection.js';
import jwt from 'jsonwebtoken';

describe('Authentication API', () => {
    const adminCredentials = {
        email: 'admin@edunexus.com',
        password: 'Admin@123'
    };

    beforeEach(async () => {
        // Reset failed attempts and lock for the admin user before each test
        await query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = $1', [adminCredentials.email]);
        // Specific cleanup for refresh tokens if needed
        await query('DELETE FROM refresh_tokens');
        await query('DELETE FROM audit_logs');
    });
    test('✔ Successful login returns tokens and user data', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send(adminCredentials);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
        expect(res.body.data.user.email).toBe(adminCredentials.email);
    });

    test('✔ Failed login increments failed_attempts', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send({ email: adminCredentials.email, password: 'WrongPassword' });

        expect(res.statusCode).toBe(401);

        const userRes = await query('SELECT failed_attempts FROM users WHERE email = $1', [adminCredentials.email]);
        expect(userRes.rows[0].failed_attempts).toBe(1);
    });

    test('✔ Account lock after 5 failed attempts', async () => {
        // Perform 5 failed attempts
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/auth/login')
                .set('X-Skip-Rate-Limit', 'true')
                .send({ email: adminCredentials.email, password: 'WrongPassword' });
        }

        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send({ email: adminCredentials.email, password: 'WrongPassword' });

        expect(res.statusCode).toBe(423); // Locked
        expect(res.body.message).toContain('locked');

        const userRes = await query('SELECT locked_until FROM users WHERE email = $1', [adminCredentials.email]);
        expect(userRes.rows[0].locked_until).not.toBeNull();
    });

    test('✔ Locked account cannot login even with correct password', async () => {
        // Lock the account manually for speed
        await query('UPDATE users SET failed_attempts = 5, locked_until = NOW() + INTERVAL \'15 minutes\' WHERE email = $1', [adminCredentials.email]);

        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send(adminCredentials);

        expect(res.statusCode).toBe(423);
        expect(res.body.success).toBe(false);
    });

    test('✔ Refresh token rotation works', async () => {
        // Login to get tokens
        const loginRes = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send(adminCredentials);

        const oldRefreshToken = loginRes.body.data.refreshToken;

        // Refresh tokens
        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: oldRefreshToken });

        expect(refreshRes.statusCode).toBe(200);
        expect(refreshRes.body.data.accessToken).toBeDefined();
        expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

        // Verify old refresh token is now invalid/revoked
        const retryRefresh = await request(app)
            .post('/api/auth/refresh')
            .set('X-Skip-Rate-Limit', 'true')
            .send({ refreshToken: oldRefreshToken });

        expect(retryRefresh.statusCode).toBe(401);
    });

    test('✔ Expired access token returns 401', async () => {
        const expiredToken = jwt.sign(
            { userId: '550e8400-e29b-41d4-a716-446655440100' },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '-1s' }
        );

        const res = await request(app)
            .get('/api/auth/me')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('expired');
    });

    test('✔ JWT tampering returns 401', async () => {
        const validTokenRes = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send(adminCredentials);

        let [header, payload, signature] = validTokenRes.body.data.accessToken.split('.');

        // Tamper with payload
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
        decodedPayload.role = 'SuperAdmin'; // Add malicious data
        const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');

        const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

        const res = await request(app)
            .get('/api/auth/me')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${tamperedToken}`);

        expect(res.statusCode).toBe(401);
    });

    test('✔ IP address and Audit logs are stored on login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send(adminCredentials);

        const userRes = await query('SELECT last_login_ip FROM users WHERE email = $1', [adminCredentials.email]);
        expect(userRes.rows[0].last_login_ip).toBeDefined();

        const auditRes = await query('SELECT * FROM audit_logs WHERE action = $1', ['login_success']);
        expect(auditRes.rows.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
        await pool.end();
    });
});
