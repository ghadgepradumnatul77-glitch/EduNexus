-- ==============================================================================
-- Migration: 010_campus_modules.sql
-- Description: Core Schema for 5 New EduNexus Campus Modules
-- Includes: Smart Notice Board, Academic Hub, Skill Exchange, Lost & Found
-- Security: Strict Row-Level Security (RLS) based on app_tenant_access_allowed
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MODULE 1: SMART NOTICE BOARD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    visibility_scope VARCHAR(50) NOT NULL DEFAULT 'all_students' CHECK (visibility_scope IN ('all_students', 'faculty_only', 'department_specific', 'system_wide')),
    department_id UUID, -- Optional: link to a future departments table if needed
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'critical'))
);

CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_announcements_visibility ON announcements(visibility_scope);
CREATE INDEX idx_announcements_expiry ON announcements(expires_at);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_announcements_isolation ON announcements
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- ------------------------------------------------------------------------------
-- MODULE 2: ACADEMIC HUB
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_courses_tenant ON courses(tenant_id);
CREATE INDEX idx_courses_faculty ON courses(faculty_id);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_courses_isolation ON courses
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_assignments_tenant ON assignments(tenant_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_assignments_isolation ON assignments
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_url TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10),
    feedback TEXT,
    UNIQUE(assignment_id, student_id) -- One submission per student per assignment for now
);

CREATE INDEX idx_submissions_tenant ON submissions(tenant_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_submissions_isolation ON submissions
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- ------------------------------------------------------------------------------
-- MODULE 3: SKILL EXCHANGE PLATFORM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, skill_name)
);

CREATE INDEX idx_skills_tenant ON skills(tenant_id);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_skills_isolation ON skills
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Skill Offers
CREATE TABLE IF NOT EXISTS skill_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    availability VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_skill_offers_tenant ON skill_offers(tenant_id);

ALTER TABLE skill_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_skill_offers_isolation ON skill_offers
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Skill Requests
CREATE TABLE IF NOT EXISTS skill_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skill_requests_tenant ON skill_requests(tenant_id);

ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_skill_requests_isolation ON skill_requests
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Skill Matches
CREATE TABLE IF NOT EXISTS skill_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES skill_offers(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES skill_requests(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(offer_id, request_id)
);

CREATE INDEX idx_skill_matches_tenant ON skill_matches(tenant_id);

ALTER TABLE skill_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_skill_matches_isolation ON skill_matches
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- ------------------------------------------------------------------------------
-- MODULE 4: LOST & FOUND SYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claimed')),
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(200) NOT NULL,
    image_url TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_lost_found_tenant ON lost_found_items(tenant_id);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);

ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_lost_found_isolation ON lost_found_items
    FOR ALL
    USING (app_tenant_access_allowed(tenant_id))
    WITH CHECK (app_tenant_access_allowed(tenant_id));

-- Note: All tables include `tenant_id` and have `DELETE CASCADE` hooks to organizations.
-- RLS policies ensure data strictly stays within the tenant boundaries.
