-- EduNexus SaaS Transformation: Phase 8 (Onboarding & Launch)

-- 1. Add Onboarding Status tracking to Organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_metadata JSONB DEFAULT '{
  "step": "registration",
  "is_completed": false,
  "configured_departments": false,
  "configured_roles": false,
  "imported_students": false
}';

-- 2. Add Index for filtering uncompleted onboardings (Admin Cleanup)
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_incomplete 
ON organizations((onboarding_metadata->>'is_completed')) 
WHERE (onboarding_metadata->>'is_completed') = 'false';
