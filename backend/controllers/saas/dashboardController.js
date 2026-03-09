import { query } from '../../db/connection.js';
import redis from '../../utils/redis.js';

/**
 * Super Admin: Platform KPI Dashboard
 */
export const getPlatformKPIs = async (req, res) => {
    try {
        // 1. Revenue Metrics (Estimated ARR)
        // Free = $0, Pro = $49/mo, Enterprise = $499/mo (Hypothetical)
        const revenueResult = await query(`
            SELECT 
                SUM(CASE WHEN subscription_tier = 'pro' THEN 49 ELSE 0 END) as monthly_pro,
                SUM(CASE WHEN subscription_tier = 'enterprise' THEN 499 ELSE 0 END) as monthly_ent,
                COUNT(*) as total_tenants,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_tenants
            FROM organizations
        `);

        // 2. Resource Metrics (Aggregated from summary table)
        const usageResult = await query(`
            SELECT 
                SUM(current_user_count) as total_users,
                SUM(current_storage_bytes) as total_storage_bytes
            FROM organization_usage
        `);

        // 3. System Health (Redis Stream Lag)
        // Total messages in stream
        const streamInfo = await redis.xlen('edunexus_events');

        const kpis = {
            revenue: {
                mrr: (parseFloat(revenueResult.rows[0].monthly_pro) || 0) + (parseFloat(revenueResult.rows[0].monthly_ent) || 0),
                arr: ((parseFloat(revenueResult.rows[0].monthly_pro) || 0) + (parseFloat(revenueResult.rows[0].monthly_ent) || 0)) * 12,
                tenantCount: parseInt(revenueResult.rows[0].total_tenants),
                activeTenants: parseInt(revenueResult.rows[0].active_tenants)
            },
            usage: {
                totalUsers: parseInt(usageResult.rows[0].total_users),
                totalStorageGB: (parseFloat(usageResult.rows[0].total_storage_bytes) / (1024 ** 3)).toFixed(2)
            },
            health: {
                eventQueueDepth: streamInfo,
                dbConnections: 0 // In real system, query pg_stat_activity
            }
        };

        res.json({ success: true, data: kpis });
    } catch (error) {
        console.error('KPI Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching platform KPIs.' });
    }
};

/**
 * Get Tenant Health Rankings (Most Active)
 */
export const getTenantRankings = async (req, res) => {
    try {
        const result = await query(`
            SELECT o.name, o.slug, o.subscription_tier, u.current_user_count
            FROM organizations o
            JOIN organization_usage u ON o.id = u.tenant_id
            ORDER BY u.current_user_count DESC
            LIMIT 10
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenant rankings.' });
    }
};

/**
 * Super Admin: Phase 9 Beta Insights
 * Focuses on PMF signals: TTO, Friction, and Milestones.
 */
export const getBetaInsights = async (req, res) => {
    try {
        // 1. Average Time To Onboard (TTO) in hours
        const ttoResult = await query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (first_value_at - provisioned_at)) / 3600)::NUMERIC(10,2) as avg_tto_hours
            FROM organizations 
            WHERE first_value_at IS NOT NULL
        `);

        // 2. Top Friction Points
        const frictionResult = await query(`
            SELECT event_key, COUNT(*) as occurs
            FROM product_events
            WHERE event_type = 'friction'
            GROUP BY event_key
            ORDER BY occurs DESC
            LIMIT 5
        `);

        // 3. Recent "Aha!" Moments
        const ahaResult = await query(`
            SELECT o.name, e.event_key, e.created_at
            FROM product_events e
            JOIN organizations o ON e.tenant_id = o.id
            WHERE e.event_type = 'milestone'
            ORDER BY e.created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                avgTtoHours: parseFloat(ttoResult.rows[0].avg_tto_hours) || 0,
                topFrictionPoints: frictionResult.rows,
                recentAhaMoments: ahaResult.rows
            }
        });
    } catch (error) {
        console.error('Beta Insights Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching beta insights.' });
    }
};

/**
 * Super Admin: Consolidated Dashboard Summary
 * Combines KPIs and Beta highlights for the Super Admin Dashboard
 */
export const getDashboardSummary = async (req, res) => {
    try {
        // 1. Tenant & Revenue KPIs
        const kpiResult = await query(`
            SELECT 
                COUNT(*)::INT as total_tenants,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END)::INT as active_tenants
            FROM organizations
        `);

        // 2. Beta Program Metrics
        const betaResult = await query(`
            SELECT 
                COUNT(*)::INT as total_beta_programs,
                COUNT(CASE WHEN status = 'active' THEN 1 ELSE 0 END)::INT as active_beta_programs,
                ROUND(AVG(bf.nps_score), 1) as avg_beta_nps
            FROM beta_programs bp
            LEFT JOIN beta_feedback bf ON bf.tenant_id = bp.tenant_id
        `);

        // 3. System Stats
        const dbConns = 0; // Placeholder for pg_stat_activity count
        const redisStatus = 'Healthy';

        res.json({
            success: true,
            data: {
                total_tenants: kpiResult.rows[0].total_tenants,
                active_tenants: kpiResult.rows[0].active_tenants,
                active_beta_programs: betaResult.rows[0].active_beta_programs,
                avg_beta_nps: betaResult.rows[0].avg_beta_nps || 0,
                db_connections: dbConns,
                redis_status: redisStatus
            }
        });
    } catch (error) {
        console.error('SaaS Dashboard Summary Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard summary.' });
    }
};
