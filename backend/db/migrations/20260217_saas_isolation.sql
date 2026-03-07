-- EduNexus SaaS Transformation: Phase 1 (Database Isolation)
-- This migration implements organization-based isolation and RLS.

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    settings JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for organization updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add organization_id to core tables
DO $$
BEGIN
    -- users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
    END IF;

    -- roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='organization_id') THEN
        -- Remove global unique constraint on role name
        ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;
        ALTER TABLE roles ADD COLUMN organization_id UUID REFERENCES organizations(id);
        -- Add scoped unique constraint
        ALTER TABLE roles ADD CONSTRAINT roles_name_org_unique UNIQUE (name, organization_id);
        CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(organization_id);
    END IF;

    -- attendance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='organization_id') THEN
        ALTER TABLE attendance ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_attendance_org_id ON attendance(organization_id);
    END IF;

    -- marks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='organization_id') THEN
        ALTER TABLE marks ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_marks_org_id ON marks(organization_id);
    END IF;

    -- departments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='organization_id') THEN
        ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_code_key;
        ALTER TABLE departments ADD COLUMN organization_id UUID REFERENCES organizations(id);
        ALTER TABLE departments ADD CONSTRAINT departments_code_org_unique UNIQUE (code, organization_id);
        CREATE INDEX IF NOT EXISTS idx_departments_org_id ON departments(organization_id);
    END IF;

    -- courses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='organization_id') THEN
        ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_code_key;
        ALTER TABLE courses ADD COLUMN organization_id UUID REFERENCES organizations(id);
        ALTER TABLE courses ADD CONSTRAINT courses_code_org_unique UNIQUE (code, organization_id);
        CREATE INDEX IF NOT EXISTS idx_courses_org_id ON courses(organization_id);
    END IF;

    -- classes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='organization_id') THEN
        ALTER TABLE classes ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX IF NOT EXISTS idx_classes_org_id ON classes(organization_id);
    END IF;
END $$;

-- 3. Elite RLS Architecture
-- Single Source of Truth isolation function
CREATE OR REPLACE FUNCTION app_tenant_access_allowed(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(current_setting('app.is_superadmin', true), 'false')::boolean = true
    OR (
      current_setting('app.current_tenant', true) IS NOT NULL
      AND org_id = current_setting('app.current_tenant', true)::uuid
    );
$$;

-- 4. Enable RLS and Apply Policies
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'roles', 'attendance', 'marks', 'departments', 'courses', 'classes')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        
        -- Default Deny
        EXECUTE format('DROP POLICY IF EXISTS deny_all ON %I', t);
        EXECUTE format('CREATE POLICY deny_all ON %I FOR ALL USING (false)', t);
        
        -- Tenant Isolation
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL 
                        USING (app_tenant_access_allowed(organization_id)) 
                        WITH CHECK (app_tenant_access_allowed(organization_id))', t);
    END LOOP;
END $$;
