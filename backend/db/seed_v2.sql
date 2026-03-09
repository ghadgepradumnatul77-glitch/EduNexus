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
INSERT INTO roles (id, name, tenant_id, description)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'Admin', '550e8400-e29b-41d4-a716-446655440999', 'University Administrator'),
    ('550e8400-e29b-41d4-a716-446655440011', 'Faculty', '550e8400-e29b-41d4-a716-446655440999', 'Teaching Staff'),
    ('550e8400-e29b-41d4-a716-446655440012', 'Student', '550e8400-e29b-41d4-a716-446655440999', 'Enrolled Student')
ON CONFLICT (name, tenant_id) DO NOTHING;

-- 4. SEED TENANT USERS
-- All users share the same hash for demo convenience: Demo@123
INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, tenant_id)
VALUES 
    (uuid_generate_v4(), 'admin@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'Demo', 'Admin', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440999'),
    (uuid_generate_v4(), 'faculty@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'Sarah', 'Professor', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440999'),
    (uuid_generate_v4(), 'student@demo.edu', '$2b$12$dM.lCxBKSWjCPxtTWS7tOOskOH4ypVc86Nwhr3JipL72J8Fl.uT1i', 'John', 'Graduate', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT (email) DO NOTHING;

-- 5. SEED ACADEMIC STRUCTURE
INSERT INTO departments (id, name, code, tenant_id)
VALUES (uuid_generate_v4(), 'Computer Science & AI', 'CS-AI', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT (code, tenant_id) DO NOTHING;

INSERT INTO courses (id, name, code, credits, department_id, tenant_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440555', 
    'Advanced Neural Networks', 
    'CS-501', 
    4, 
    (SELECT id FROM departments WHERE code = 'CS-AI' AND tenant_id = '550e8400-e29b-41d4-a716-446655440999' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440999'
) ON CONFLICT (code, tenant_id) DO NOTHING;

-- 6. SEED CLASSES & ENROLLMENTS
INSERT INTO classes (id, course_id, faculty_id, semester, academic_year, tenant_id)
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
INSERT INTO attendance (class_id, student_id, date, status, tenant_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440999'),
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), CURRENT_DATE - 1, 'present', '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT DO NOTHING;

INSERT INTO marks (class_id, student_id, exam_type, exam_name, marks_obtained, max_marks, tenant_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440777', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), 'midterm', 'Neural Foundations', 88.5, 100, '550e8400-e29b-41d4-a716-446655440999')
ON CONFLICT DO NOTHING;

-- 8. SEED CAMPUS MODULES (Notice Board, Academic Hub, Skill Exchange, Lost & Found)

-- 8a. Announcements
INSERT INTO announcements (id, tenant_id, title, content, visibility_scope, created_by, priority_level)
VALUES 
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440999', 'Welcome to the New Academic Year!', 'We are excited to launch the new EduNexus Campus Operating System.', 'all_students', (SELECT id FROM users WHERE email = 'admin@demo.edu' LIMIT 1), 'high'),
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440999', 'Library Hours Extended', 'The main campus library will now be open 24/7 during the mid-term week.', 'all_students', (SELECT id FROM users WHERE email = 'admin@demo.edu' LIMIT 1), 'normal')
ON CONFLICT DO NOTHING;

-- 8b. Assignments
INSERT INTO assignments (id, tenant_id, course_id, title, description, due_date, created_by)
VALUES 
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440999', '550e8400-e29b-41d4-a716-446655440555', 'Project 1: Backpropagation Implementation', 'Implement a neural network from scratch using Python numpy.', CURRENT_TIMESTAMP + interval '7 days', (SELECT id FROM users WHERE email = 'faculty@demo.edu' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 8c. Skills Matrix
INSERT INTO skills (id, tenant_id, skill_name, category)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440810', '550e8400-e29b-41d4-a716-446655440999', 'Python', 'Programming'),
    ('550e8400-e29b-41d4-a716-446655440811', '550e8400-e29b-41d4-a716-446655440999', 'Linear Algebra', 'Mathematics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_offers (id, tenant_id, student_id, skill_id, description, availability)
VALUES 
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440999', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), '550e8400-e29b-41d4-a716-446655440810', 'I can help with basic to advanced Python debugging and scripting.', 'Weekends 2PM-6PM')
ON CONFLICT DO NOTHING;

INSERT INTO lost_found_items (id, tenant_id, item_name, description, category, status, reported_by, location)
VALUES 
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440999', 'Blue Hydroflask', 'My water bottle has stickers on it', 'Other', 'lost', (SELECT id FROM users WHERE email = 'student@demo.edu' LIMIT 1), 'Main Cafeteria')
ON CONFLICT DO NOTHING;
