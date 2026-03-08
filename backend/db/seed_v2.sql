-- EduNexus Hardened Seed V2
-- This script seeds a complete sandbox environment with strict tenant isolation.

-- 1. SEED PLATFORM ADMIN (Infrastructure Control Plane)
-- These accounts inhabit the 'platform_admins' table and CANNOT access tenant data via RLS.
INSERT INTO platform_admins (id, email, password_hash, force_password_change, is_active)
VALUES (
    uuid_generate_v4(), 
    'ops@edunexus.infra', 
    '$2b$12$WF6qI2JjvnYAfBgyvClJiuMKlK6qgQkYUmLAaRNUUn15BDnE0fx9u', -- EduNexus!Ops#2026
    FALSE, 
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- 2. SEED DEMO TENANT (ERP Sandbox)
INSERT INTO organizations (id, name, slug, plan, status)
VALUES (
    '550e8400-e29b-41d4-a716-446655440999', 
    'EduNexus Demo University', 
    'demo-uni', 
    'enterprise', 
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- 3. SEED TENANT-SPECIFIC ROLES
-- Note: Roles are now scoped to the organization.
INSERT INTO roles (id, name, organization_id, description)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'Admin', '550e8400-e29b-41d4-a716-446655440999', 'University Administrator'),
    ('550e8400-e29b-41d4-a716-446655440011', 'Faculty', '550e8400-e29b-41d4-a716-446655440999', 'Teaching Staff'),
    ('550e8400-e29b-41d4-a716-446655440012', 'Student', '550e8400-e29b-41d4-a716-446655440999', 'Enrolled Student')
ON CONFLICT (name, organization_id) DO NOTHING;

-- 4. SEED TENANT USERS
-- All users share the same hash for demo convenience: Demo@123
INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, organization_id)
VALUES 
    (uuid_generate_v4(), 'admin@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'Demo', 'Admin', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440999'),
    (uuid_generate_v4(), 'faculty@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'Sarah', 'Professor', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440999'),
    (uuid_generate_v4(), 'student@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'John', 'Graduate', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT (email) DO NOTHING;

-- 5. SEED ACADEMIC STRUCTURE
INSERT INTO departments (id, name, code, organization_id)
VALUES (uuid_generate_v4(), 'Computer Science & AI', 'CS-AI', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT (code, organization_id) DO NOTHING;

INSERT INTO courses (id, name, code, credits, department_id, organization_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440555', 
    'Advanced Neural Networks', 
    'CS-501', 
    4, 
    (SELECT id FROM departments WHERE code = 'CS-AI' AND organization_id = '550e8400-e29b-41d4-a716-446655440999' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440999'
) ON CONFLICT (code, organization_id) DO NOTHING;

-- 6. SEED CLASSES & ENROLLMENTS
INSERT INTO classes (id, course_id, faculty_id, semester, academic_year, organization_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440777',
    '550e8400-e29b-41d4-a716-446655440555',
    (SELECT id FROM users WHERE email = 'faculty@demo.edu' LIMIT 1),
    'Fall',
    '2025-26',
    '550e8400-e29b-41d4-a716-446655440999'
) ON CONFLICT DO NOTHING;

INSERT INTO class_enrollments (class_id, student_id)
SELECT '550e8400-e29b-41d4-a716-446655440777', id 
FROM users WHERE email = 'student@demo.edu'
ON CONFLICT DO NOTHING;

-- 7. SEED DEMO METRICS (Attendance & Marks)
INSERT INTO attendance (class_id, student_id, date, status, organization_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440999'),
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), CURRENT_DATE - 1, 'present', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT DO NOTHING;

INSERT INTO marks (class_id, student_id, exam_type, exam_name, marks_obtained, max_marks, organization_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), 'midterm', 'Neural Foundations', 88.5, 100, '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT DO NOTHING;
