import request from 'supertest';
import app from '../server.js';
import { query, default as pool } from '../db/connection.js';

describe('User Management API', () => {
    let adminToken;
    const studentRoleId = '550e8400-e29b-41d4-a716-446655440004';
    let testUserId;

    beforeAll(async () => {
        const adminRes = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send({ email: 'admin@edunexus.com', password: 'Admin@123' });
        adminToken = adminRes.body.data.accessToken;
    });

    test('✔ Create user works and prevents duplicate email', async () => {
        const newUser = {
            email: 'newuser@test.com',
            password: 'Password@123',
            firstName: 'New',
            lastName: 'User',
            roleId: studentRoleId
        };

        const res = await request(app)
            .post('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newUser);

        expect(res.statusCode).toBe(201);
        testUserId = res.body.data.id;

        const dupRes = await request(app)
            .post('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newUser);

        expect(dupRes.statusCode).toBe(409);
    });

    test('✔ Update user works', async () => {
        const res = await request(app)
            .put(`/api/users/${testUserId}`)
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ firstName: 'Updated' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.firstName).toBe('Updated');
    });

    test('✔ Soft delete user works', async () => {
        const res = await request(app)
            .delete(`/api/users/${testUserId}`)
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);

        const dbUser = await query('SELECT is_deleted FROM users WHERE id = $1', [testUserId]);
        expect(dbUser.rows[0].is_deleted).toBe(true);
    });

    test('✔ Soft deleted user cannot login', async () => {
        // Set password for the test user to try login
        const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWeCrHu.'; // Admin@123
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, testUserId]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'newuser@test.com', password: 'Admin@123' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('deactivated');
    });

    test('✔ Soft deleted user not visible in getUsers list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`);

        const users = res.body.data.users;
        const deletedUser = users.find(u => u.id === testUserId);
        expect(deletedUser).toBeUndefined();
    });

    afterAll(async () => {
        await pool.end();
    });
});
