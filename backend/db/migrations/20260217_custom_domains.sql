-- EduNexus SaaS Transformation: Phase 7 (Custom Domains)

-- 1. Create Organization Domains Table
CREATE TABLE IF NOT EXISTS organization_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    dns_verification_token VARCHAR(255),
    ssl_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for Host header lookups
CREATE INDEX IF NOT EXISTS idx_domains_domain ON organization_domains(domain);

-- 2. Register with Organization Schema
-- (Optional) Add a flag to organizations for custom domain entitlement
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allow_custom_domains BOOLEAN DEFAULT FALSE;
UPDATE subscription_plans SET allow_custom_domains = TRUE WHERE name IN ('pro', 'enterprise');
