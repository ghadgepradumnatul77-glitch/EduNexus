import { withTenantContext, query } from '../db/connection.js';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker'; // Note: Assumes faker is installed or used via peer

/**
 * EduNexus Demo Seeding Engine
 * Usage: node scripts/seed-demo.js <tenant_slug>
 */
const seedDemo = async (slug) => {
    console.log(`🚀 Seeding Demo Data for tenant: ${slug}`);

    try {
        // 1. Resolve Org
        const orgResult = await query('SELECT id FROM organizations WHERE slug = $1', [slug]);
        if (orgResult.rows.length === 0) throw new Error(`Organization ${slug} not found.`);
        const orgId = orgResult.rows[0].id;

        // 2. Get Student Role
        const roleResult = await query('SELECT id FROM roles WHERE name = $1 AND organization_id = $2', ['student', orgId]);
        const studentRoleId = roleResult.rows[0].id;

        await withTenantContext(orgId, true, async (client) => {
            // A. Create Departments
            const depts = [
                { name: 'Computer Science', code: 'CS' },
                { name: 'Mathematics', code: 'MATH' },
                { name: 'Physics', code: 'PHYS' },
                { name: 'Business', code: 'BUS' }
            ];
            const deptIds = [];
            for (const dept of depts) {
                const res = await client.query(
                    'INSERT INTO departments (name, code, organization_id) VALUES ($1, $2, $3) RETURNING id',
                    [dept.name, dept.code, orgId]
                );
                deptIds.push(res.rows[0].id);
            }

            // B. Create Students (50)
            console.log(' - Generating 50 students...');
            const studentIds = [];
            for (let i = 0; i < 50; i++) {
                const email = `student${i}@${slug}.edu`;
                const password = await bcrypt.hash('password123', 10);
                const res = await client.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id) 
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [email, password, faker.person.firstName(), faker.person.lastName(), studentRoleId, orgId]
                );
                studentIds.push(res.rows[0].id);
            }

            // C. Create Courses & Map Students
            console.log(' - Setting up courses and enrollments...');
            for (const deptId of deptIds) {
                const courseCode = `COURSE-${faker.string.alphanumeric(5).toUpperCase()}`;
                const courseRes = await client.query(
                    'INSERT INTO courses (name, code, department_id, organization_id) VALUES ($1, $2, $3, $4) RETURNING id',
                    [`Intro to ${faker.commerce.productName()}`, courseCode, deptId, orgId]
                );
                const courseId = courseRes.rows[0].id;

                // Enroll students from this dept (simulated)
                for (let i = 0; i < 10; i++) {
                    // In a real app, there's an enrollments table
                }
            }

            // D. Generate Attendance & Marks (Last 30 Days)
            console.log(' - Generating historical logs (30 days)...');
            const now = new Date();
            for (let d = 0; d < 30; d++) {
                const date = new Date(now);
                date.setDate(date.getDate() - d);

                for (const studentId of studentIds) {
                    // 90% attendance rate
                    const status = Math.random() > 0.1 ? 'present' : 'absent';
                    await client.query(
                        `INSERT INTO attendance (student_id, status, date, organization_id) 
                         VALUES ($1, $2, $3, $4)`,
                        [studentId, status, date, orgId]
                    );

                    // Random Grade (60 - 100)
                    if (d % 7 === 0) { // Weekly exams
                        const score = Math.floor(Math.random() * 40) + 60;
                        await client.query(
                            `INSERT INTO marks (student_id, exam_name, exam_type, marks_obtained, max_marks, organization_id) 
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [studentId, 'General Exam', 'weekly', score, 100, orgId]
                        );
                    }
                }
            }
        });

        console.log(`✅ Demo seeding complete for ${slug}.`);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    }
};

const slug = process.argv[2];
if (!slug) {
    console.log('Usage: node scripts/seed-demo.js <slug>');
} else {
    seedDemo(slug);
}
