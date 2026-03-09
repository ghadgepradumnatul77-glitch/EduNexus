-- EduNexus SaaS Transformation: Phase 7 (Custom Domains - Refined)

-- 1. Create Organization Domains Table
CREATE TABLE IF NOT EXISTS organization_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    ssl_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for Organization Lookups
CREATE INDEX IF NOT EXISTS idx_org_domains_org_id ON organization_domains(tenant_id);

-- Index for Host header resolution (High Performance)
CREATE INDEX IF NOT EXISTS idx_org_domains_domain ON organization_domains(domain);
