-- ============================================================
-- EduNexus Phase 9: Institutional Beta Program Schema
-- Run: psql -d edunexus -f migrations/20260224_beta_program.sql
-- ============================================================

-- Beta Programs: tracks each institution enrolled in the beta cohort
CREATE TABLE IF NOT EXISTS beta_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    cohort          VARCHAR(50)  NOT NULL DEFAULT '2026-Q1',
    status          VARCHAR(30)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'churned', 'converted', 'paused')),
    enrolled_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ends_at         TIMESTAMPTZ,
    contact_name    VARCHAR(255),
    contact_email   VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id)
);

-- Weekly check-in / feedback submissions from institutional admins
CREATE TABLE IF NOT EXISTS beta_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submitted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    week_number     INT  NOT NULL,
    year            INT  NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    nps_score       INT  CHECK (nps_score BETWEEN 0 AND 10),
    overall_rating  INT  CHECK (overall_rating BETWEEN 1 AND 5),
    friction_points TEXT,
    feature_requests TEXT,
    positive_highlights TEXT,
    would_pay       BOOLEAN DEFAULT FALSE,
    willing_to_refer BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, week_number, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_beta_programs_org ON beta_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_beta_programs_status ON beta_programs(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_org ON beta_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_week ON beta_feedback(year, week_number);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_beta_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_beta_programs_updated_at ON beta_programs;
CREATE TRIGGER trg_beta_programs_updated_at
    BEFORE UPDATE ON beta_programs
    FOR EACH ROW EXECUTE FUNCTION update_beta_programs_updated_at();
