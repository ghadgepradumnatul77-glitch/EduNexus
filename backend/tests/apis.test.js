import request from 'supertest';
import app from '../server.js';
import { query, default as pool } from '../db/connection.js';

describe('Attendance & Marks API', () => {
    let adminToken, studentId;
    const adminId = '550e8400-e29b-41d4-a716-446655440100';
    let classId;

    beforeAll(async () => {
        const adminRes = await request(app)
            .post('/api/auth/login')
            .set('X-Skip-Rate-Limit', 'true')
            .send({ email: 'admin@edunexus.com', password: 'Admin@123' });
        adminToken = adminRes.body.data.accessToken;

        // Cleanup before setup to avoid unique constraints
        await query('DELETE FROM marks WHERE exam_name = $1', ['Pop Quiz 1']);
        await query('DELETE FROM attendance WHERE student_id IN (SELECT id FROM users WHERE email = $1)', ['student2@test.com']);
        await query('DELETE FROM classes WHERE course_id IN (SELECT id FROM courses WHERE code = $1)', ['TC101']);
        await query('DELETE FROM users WHERE email = $1', ['student2@test.com']);
        await query('DELETE FROM courses WHERE code = $1', ['TC101']);

        // Setup a test course, class, and student for logical flow
        const deptRes = await query('SELECT id FROM departments LIMIT 1');
        const deptId = deptRes.rows[0].id;

        const courseRes = await query('INSERT INTO courses (name, code, department_id, credits) VALUES (\'Test Course\', \'TC101\', $1, 3) RETURNING id', [deptId]);
        const courseId = courseRes.rows[0].id;

        const classRes = await query('INSERT INTO classes (course_id, faculty_id, semester, academic_year) VALUES ($1, $2, \'Spring\', \'2026\') RETURNING id', [courseId, adminId]);
        classId = classRes.rows[0].id;

        const studentRes = await query('INSERT INTO users (email, password_hash, first_name, last_name, role_id) VALUES (\'student2@test.com\', \'hash\', \'Stu\', \'Dent\', \'550e8400-e29b-41d4-a716-446655440004\') RETURNING id');
        studentId = studentRes.rows[0].id;
    });

    test('✔ Attendance creation works', async () => {
        const res = await request(app)
            .post('/api/attendance')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                classId: classId,
                studentId: studentId,
                date: new Date().toISOString().split('T')[0],
                status: 'present'
            });

        expect(res.statusCode).toBe(201);
    });

    test('✔ Marks upload works', async () => {
        const res = await request(app)
            .post('/api/marks')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                classId: classId,
                studentId: studentId,
                examType: 'quiz',
                examName: 'Pop Quiz 1',
                marksObtained: 85,
                maxMarks: 100
            });

        expect(res.statusCode).toBe(201);
    });

    test('✔ Invalid payload rejected (missing fields)', async () => {
        const res = await request(app)
            .post('/api/attendance')
            .set('X-Skip-Rate-Limit', 'true')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                classId: classId
            });

        expect(res.statusCode).toBe(400);
    });

    afterAll(async () => {
        await pool.end();
    });
});
