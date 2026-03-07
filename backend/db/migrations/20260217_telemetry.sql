-- EduNexus SaaS Transformation: Phase 9 (Telemetry)

-- 1. Create Product Events Table for Telemetry
CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_key VARCHAR(100) NOT NULL, -- e.g., 'onboarding_start', 'first_attendance_marked', 'friction_click'
    event_type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'friction', 'milestone'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Indexes for Performance Analytics
CREATE INDEX IF NOT EXISTS idx_product_events_org_id ON product_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_events_event_key ON product_events(event_key);

-- 3. Add 'onboarded_at' to organizations to track TTO (Time To Onboard)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_value_at TIMESTAMP;
