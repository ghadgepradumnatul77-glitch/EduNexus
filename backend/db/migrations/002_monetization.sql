-- EduNexus SaaS Transformation: Phase 6 (Monetization & Billing)

-- 1. Create Subscription Plans Reference Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'pro', 'enterprise'
    stripe_price_id VARCHAR(255),
    max_users INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 500,
    features_json JSONB DEFAULT '{}', -- e.g. {"advanced_analytics": true, "custom_export": true}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Update Organizations with Subscription Data
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free' REFERENCES subscription_plans(name);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'; -- 'active', 'past_due', 'canceled', 'incomplete'
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;

-- 3. Create Usage Metrics Table for Metering
-- Uses Partitioning by recorded_at for performance in large systems
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    metric_key VARCHAR(100) NOT NULL, -- 'active_users', 'storage_bytes', 'api_calls'
    value BIGINT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metrics_org_recorded ON tenant_usage_metrics(organization_id, recorded_at DESC);

-- 4. Create Organization Usage Summary Table (for quick checks)
CREATE TABLE IF NOT EXISTS organization_usage (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id),
    current_user_count INTEGER DEFAULT 0,
    current_storage_bytes BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Plans
INSERT INTO subscription_plans (name, stripe_price_id, max_users, max_storage_mb, features_json)
VALUES 
('free', NULL, 10, 500, '{"basic_reports": true}'),
('pro', 'price_H5ggW9v169vn6c', 100, 10240, '{"basic_reports": true, "advanced_analytics": true, "custom_export": true}'),
('enterprise', 'price_H5ggW9v169vn6d', 999999, 1048576, '{"basic_reports": true, "advanced_analytics": true, "custom_export": true, "white_label": true, "dedicated_support": true}')
ON CONFLICT (name) DO UPDATE SET
    max_users = EXCLUDED.max_users,
    max_storage_mb = EXCLUDED.max_storage_mb,
    features_json = EXCLUDED.features_json;
