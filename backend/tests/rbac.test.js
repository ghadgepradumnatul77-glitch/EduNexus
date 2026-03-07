import request from 'supertest';
import app from '../server.js';
import { query, default as pool } from '../db/connection.js';

describe('RBAC API', () => {
    let adminToken, facultyToken, studentToken;
    const adminId = '550e8400-e29b-41d4-a716-446655440100';
    const facultyRoleId = '550e8400-e29b-41d4-a716-446655440003';
    const studentRoleId = '550e8400-e29b-41d4-a716-446655440004';

    beforeAll(async () => {
        // Create faculty and student users for testing
        await query('DELETE FROM users WHERE email IN ($1, $2)', ['faculty@test.com', 'student@test.com']);

        await query(`INSERT INTO users (email, password_hash, first_name, last_name, role_id) VALUES 
            ('faculty@test.com', 'hash', 'Test', 'Faculty', $1),
            ('student@test.com', 'hash', 'Test', 'Student', $2)`,
            [facultyRoleId, studentRoleId]
        );

        // Get tokens (bypassing logic to save time, using controller-like generation or just login if possible)
        // For simplicity in tests, we'll login
        // But since we don't have passwords for fake users, we'll update them to Admin@123 first
        const hash = '$2b$12$Xfyoa65F5dx6FZVajSrOiePXOx4W6mTwZI3auaFiNRgNso.PNQY0W'; // Admin@123
        await query('UPDATE users SET password_hash = $1 WHERE email IN ($2, $3)', [hash, 'faculty@test.com', 'student@test.com']);

        const adminRes = await request(app).post('/api/auth/login').set('X-Skip-Rate-Limit', 'true').send({ email: 'admin@edunexus.com', password: 'Admin@123' });
        const facultyRes = await request(app).post('/api/auth/login').set('X-Skip-Rate-Limit', 'true').send({ email: 'faculty@test.com', password: 'Admin@123' });
        const studentRes = await request(app).post('/api/auth/login').set('X-Skip-Rate-Limit', 'true').send({ email: 'student@test.com', password: 'Admin@123' });

        adminToken = adminRes.body.data.accessToken;
        facultyToken = facultyRes.body.data.accessToken;
        studentToken = studentRes.body.data.accessToken;
    });

    test('✔ Admin can access user list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('✔ Faculty cannot access user list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${facultyToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('✔ Student cannot access user list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('✔ Faculty can access attendance (hypothetical route check)', async () => {
        // Just checking the route exists and permissions work
        const res = await request(app)
            .get('/api/attendance/class/550e8400-e29b-41d4-a716-446655440001') // Random UUID
            .set('Authorization', `Bearer ${facultyToken}`);
        // Might be 404 if class doesn't exist, but should NOT be 403
        expect(res.statusCode).not.toBe(403);
    });

    test('✔ 401 for missing token', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(401);
    });

    afterAll(async () => {
        await pool.end();
    });
});
