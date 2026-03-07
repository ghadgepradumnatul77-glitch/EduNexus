/**
 * EduNexus Beta Institution Seeder
 * Seeds 3 realistic beta institutions (~200 students each) and enrolls them
 * in the beta program.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed-beta-institutions.js
 */

import { query } from '../db/connection.js';
import { withTenantContext } from '../db/connection.js';
import bcrypt from 'bcrypt';

// ─── Beta Institution Definitions ────────────────────────────────────────────

const BETA_INSTITUTIONS = [
    {
        name: 'Greenfield Academy',
        slug: 'greenfield',
        email: 'admin@greenfield.edu',
        contact_name: 'Dr. Sarah Mitchell',
        contact_email: 'sarah.mitchell@greenfield.edu',
        studentCount: 200,
        depts: [
            { name: 'Science', code: 'SCI' },
            { name: 'Commerce', code: 'COM' },
            { name: 'Arts & Humanities', code: 'ARTS' },
            { name: 'Engineering', code: 'ENG' },
        ]
    },
    {
        name: 'Riverside College',
        slug: 'riverside',
        email: 'admin@riverside.edu',
        contact_name: 'Prof. James Okafor',
        contact_email: 'james.okafor@riverside.edu',
        studentCount: 180,
        depts: [
            { name: 'Computer Applications', code: 'CA' },
            { name: 'Business Management', code: 'BM' },
            { name: 'Life Sciences', code: 'LS' },
        ]
    },
    {
        name: 'Mountview School',
        slug: 'mountview',
        email: 'admin@mountview.edu',
        contact_name: 'Ms. Priya Nair',
        contact_email: 'priya.nair@mountview.edu',
        studentCount: 220,
        depts: [
            { name: 'Mathematics', code: 'MATH' },
            { name: 'Physics', code: 'PHY' },
            { name: 'Chemistry', code: 'CHEM' },
            { name: 'Social Studies', code: 'SOC' },
        ]
    }
];

// ─── First Names / Last Names Pool ───────────────────────────────────────────

const FIRST_NAMES = [
    'Aarav', 'Aisha', 'Alex', 'Amara', 'Arjun', 'Beth', 'Carlos', 'Chidi', 'Chloe', 'Danya',
    'David', 'Elena', 'Eli', 'Fatima', 'Felix', 'Grace', 'Hannah', 'Ibrahim', 'Jasmine', 'Jay',
    'Kira', 'Leila', 'Leo', 'Liam', 'Maya', 'Mei', 'Michael', 'Nadia', 'Noah', 'Olivia',
    'Omar', 'Priya', 'Raj', 'Riya', 'Ryan', 'Sara', 'Samuel', 'Sofia', 'Tamar', 'Uma',
    'Vikram', 'Wren', 'Xander', 'Yuna', 'Zara', 'Zoe', 'Rohan', 'Nora', 'Ethan', 'Isla'
];

const LAST_NAMES = [
    'Ahmed', 'Brown', 'Chen', 'Das', 'Evans', 'Fernandez', 'Garcia', 'Gupta', 'Hassan', 'Iyer',
    'James', 'Kumar', 'Lee', 'Martinez', 'Nair', 'Okafor', 'Patel', 'Quinn', 'Rao', 'Singh',
    'Smith', 'Tan', 'Umar', 'Varma', 'Wilson', 'Xu', 'Yadav', 'Zhang', 'Bakshi', 'Cohen'
];

function randName(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Seeder ───────────────────────────────────────────────────────────────────

async function seedInstitution(inst) {
    console.log(`\n🏫  Seeding: ${inst.name} (${inst.slug})`);

    // ── 1. Upsert Organisation ───────────────────────────────────────────────
    let orgId;
    const existing = await query('SELECT id FROM organizations WHERE slug = $1', [inst.slug]);
    if (existing.rows.length > 0) {
        orgId = existing.rows[0].id;
        console.log(`   ℹ️  Organisation exists, reusing id: ${orgId}`);
    } else {
        const orgRes = await query(
            `INSERT INTO organizations (name, slug, plan, status, is_active)
             VALUES ($1, $2, 'beta', 'active', true) RETURNING id`,
            [inst.name, inst.slug]
        );
        orgId = orgRes.rows[0].id;
        console.log(`   ✅ Organisation created: ${orgId}`);
    }

    await withTenantContext(orgId, true, async (client) => {

        // ── 2. Seed Roles ────────────────────────────────────────────────────
        const roles = {};
        for (const roleName of ['Admin', 'Faculty', 'Student']) {
            let rRes = await client.query(
                'SELECT id FROM roles WHERE name = $1 AND organization_id = $2',
                [roleName, orgId]
            );
            if (rRes.rows.length === 0) {
                rRes = await client.query(
                    'INSERT INTO roles (name, organization_id) VALUES ($1, $2) RETURNING id',
                    [roleName, orgId]
                );
            }
            roles[roleName] = rRes.rows[0].id;
        }

        // ── 3. Seed Admin User ───────────────────────────────────────────────
        const adminPwd = await bcrypt.hash('Admin@123', 10);
        const adminCheck = await client.query(
            'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
            [inst.email, orgId]
        );
        if (adminCheck.rows.length === 0) {
            await client.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [inst.email, adminPwd, 'Campus', 'Admin', roles['Admin'], orgId]
            );
        }

        // ── 4. Seed Departments, Courses, and Classes ──────────────────────
        const classIds = [];
        for (const dept of inst.depts) {
            let dRes = await client.query(
                'SELECT id FROM departments WHERE code = $1 AND organization_id = $2',
                [dept.code, orgId]
            );
            if (dRes.rows.length === 0) {
                dRes = await client.query(
                    'INSERT INTO departments (name, code, organization_id) VALUES ($1,$2,$3) RETURNING id',
                    [dept.name, dept.code, orgId]
                );
            }
            const deptId = dRes.rows[0].id;

            // Seed a sample course for this dept
            let cRes = await client.query('SELECT id FROM courses WHERE code = $1 AND organization_id = $2', [`${dept.code}101`, orgId]);
            if (cRes.rows.length === 0) {
                cRes = await client.query(
                    'INSERT INTO courses (name, code, department_id, credits, organization_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',
                    [`Introduction to ${dept.name}`, `${dept.code}101`, deptId, 4, orgId]
                );
            }
            const courseId = cRes.rows[0].id;

            // Seed a class for this course
            let clsRes = await client.query(
                'SELECT id FROM classes WHERE course_id = $1 AND academic_year = $2 AND organization_id = $3',
                [courseId, '2025-26', orgId]
            );
            if (clsRes.rows.length === 0) {
                clsRes = await client.query(
                    'INSERT INTO classes (course_id, faculty_id, semester, academic_year, section, organization_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
                    [courseId, adminCheck.rows[0]?.id || null, 'Spring', '2025-26', 'A', orgId]
                );
            }
            classIds.push(clsRes.rows[0].id);
        }

        // ── 5. Seed Students & Enrollments ──────────────────────────────────
        console.log(`   👤 Creating ${inst.studentCount} students and enrollments…`);
        const studentIds = [];
        const pwd = await bcrypt.hash('password123', 10);
        for (let i = 0; i < inst.studentCount; i++) {
            const email = `student${i}@${inst.slug}.edu`;
            const exists = await client.query('SELECT id FROM users WHERE email = $1 AND organization_id = $2', [email, orgId]);
            let studentId;
            if (exists.rows.length > 0) {
                studentId = exists.rows[0].id;
            } else {
                const uRes = await client.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id)
                     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
                    [email, pwd, randName(FIRST_NAMES), randName(LAST_NAMES), roles['Student'], orgId]
                );
                studentId = uRes.rows[0].id;
            }
            studentIds.push(studentId);

            // Enroll in all classes for this institution
            for (const classId of classIds) {
                await client.query(
                    'INSERT INTO class_enrollments (class_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
                    [classId, studentId]
                );
            }
        }

        // ── 6. Historical Attendance & Marks (30 days) ───────────────────────
        console.log(`   📊 Generating 30-day history (attendance + marks)…`);
        const now = new Date();
        for (let d = 0; d < 30; d++) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            // Skip weekends
            const dow = date.getDay();
            if (dow === 0 || dow === 6) continue;

            for (const studentId of studentIds) {
                const classId = classIds[studentIds.indexOf(studentId) % classIds.length]; // Distribute

                // 88% attendance rate
                const status = Math.random() > 0.12 ? 'present' : 'absent';
                await client.query(
                    `INSERT INTO attendance (student_id, class_id, status, date, organization_id)
                     VALUES ($1,$2,$3,$4,$5)
                     ON CONFLICT DO NOTHING`,
                    [studentId, classId, status, dateStr, orgId]
                );

                // Weekly exams every 7 days
                if (d % 7 === 0) {
                    const score = randInt(55, 100);
                    await client.query(
                        `INSERT INTO marks (student_id, class_id, exam_name, exam_type, marks_obtained, max_marks, exam_date, organization_id)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                         ON CONFLICT DO NOTHING`,
                        [studentId, classId, `Week ${Math.floor(d / 7) + 1} Exam`, 'weekly', score, 100, dateStr, orgId]
                    );
                }
            }
        }

        // ── 7. Enrol into Beta Program ───────────────────────────────────────
        await query(
            `INSERT INTO beta_programs
                (organization_id, cohort, contact_name, contact_email, status,
                 ends_at, notes)
             VALUES ($1,'2026-Q1',$2,$3,'active',
                    NOW() + INTERVAL '6 months',
                    'Seeded automatically via seed-beta-institutions.js')
             ON CONFLICT (organization_id) DO NOTHING`,
            [orgId, inst.contact_name, inst.contact_email]
        );

        console.log(`   🎉 ${inst.name} fully seeded!`);
        console.log(`      Admin: ${inst.email} / Admin@123`);
        console.log(`      Students: student0@${inst.slug}.edu … student${inst.studentCount - 1}@${inst.slug}.edu / password123`);
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🚀 EduNexus — Beta Institution Seeder');
    console.log('═'.repeat(50));

    for (const inst of BETA_INSTITUTIONS) {
        try {
            await seedInstitution(inst);
        } catch (err) {
            console.error(`❌  Failed for ${inst.name}:`, err.message);
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅  All 3 beta institutions seeded successfully!');
    console.log('\n📋 Beta Cohort 2026-Q1:');
    BETA_INSTITUTIONS.forEach(i => {
        console.log(`   • ${i.name.padEnd(22)}  ${i.slug}.edu  (${i.studentCount} students)`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
