-- Seed data for EduNexus MVP

-- Insert roles
INSERT INTO roles (id, name, description) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'Full system access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO roles (id, name, description)
SELECT '550e8400-e29b-41d4-a716-446655440002', 'Admin', 'Administrative access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO roles (id, name, description)
SELECT '550e8400-e29b-41d4-a716-446655440003', 'Faculty', 'Faculty member access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO roles (id, name, description)
SELECT '550e8400-e29b-41d4-a716-446655440004', 'Student', 'Student access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = '550e8400-e29b-41d4-a716-446655440004');

INSERT INTO roles (id, name, description)
SELECT '550e8400-e29b-41d4-a716-446655440005', 'Staff', 'Staff member access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = '550e8400-e29b-41d4-a716-446655440005');

-- Insert default super admin
INSERT INTO users (id, email, password_hash, first_name, last_name, role_id)
SELECT '550e8400-e29b-41d4-a716-446655440100', 
       'admin@demo.edu', 
       '$2b$12$Xfyoa65F5dx6FZVajSrOiePXOx4W6mTwZI3auaFiNRgNso.PNQY0W', 
       'Demo', 
       'Admin', 
       '550e8400-e29b-41d4-a716-446655440001'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@demo.edu');

-- Insert sample departments
INSERT INTO departments (name, code, description)
SELECT 'Computer Science', 'CS', 'Department of Computer Science and Engineering'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'CS');

INSERT INTO departments (name, code, description)
SELECT 'Electronics', 'ECE', 'Department of Electronics and Communication Engineering'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'ECE');

INSERT INTO departments (name, code, description)
SELECT 'Mechanical', 'ME', 'Department of Mechanical Engineering'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'ME');

INSERT INTO departments (name, code, description)
SELECT 'Civil', 'CE', 'Department of Civil Engineering'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'CE');

-- Insert sample courses
INSERT INTO courses (name, code, department_id, credits)
SELECT 'Data Structures', 'CS201', (SELECT id FROM departments WHERE code = 'CS' LIMIT 1), 4
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'CS201');

INSERT INTO courses (name, code, department_id, credits)
SELECT 'Database Systems', 'CS301', (SELECT id FROM departments WHERE code = 'CS' LIMIT 1), 4
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'CS301');

INSERT INTO courses (name, code, department_id, credits)
SELECT 'Digital Electronics', 'ECE201', (SELECT id FROM departments WHERE code = 'ECE' LIMIT 1), 3
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'ECE201');

INSERT INTO courses (name, code, department_id, credits)
SELECT 'Thermodynamics', 'ME201', (SELECT id FROM departments WHERE code = 'ME' LIMIT 1), 3
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'ME201');

