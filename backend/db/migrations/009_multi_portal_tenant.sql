-- EduNexus Multi-Portal SaaS Refactor: Phase 2 (Tenant Naming & Isolation)
-- This migration renames organization_id to tenant_id across all relevant tables.

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'roles', 'attendance', 'marks', 'departments', 'courses', 'classes', 'refresh_tokens', 'audit_logs', 'organization_features', 'organization_usage')
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='organization_id') THEN
            EXECUTE format('ALTER TABLE %I RENAME COLUMN organization_id TO tenant_id', t);
        END IF;
    END LOOP;
END $$;

-- Update the RLS isolation function
CREATE OR REPLACE FUNCTION app_tenant_access_allowed(check_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(NULLIF(current_setting('app.is_superadmin', true), ''), 'false')::boolean = true
    OR (
      NULLIF(current_setting('app.current_tenant', true), '') IS NOT NULL
      AND check_tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
    );
$$;

-- Drop prior policies and recreate with new column name
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'roles', 'attendance', 'marks', 'departments', 'courses', 'classes', 'organization_features', 'organization_usage', 'refresh_tokens', 'audit_logs')
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='tenant_id') THEN
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
            EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL 
                            USING (app_tenant_access_allowed(tenant_id)) 
                            WITH CHECK (app_tenant_access_allowed(tenant_id))', t);
        END IF;
    END LOOP;
END $$;
