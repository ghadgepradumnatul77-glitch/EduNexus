import { withTenantContext, query } from '../../db/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Public Onboarding: Register New Organization
 * This is the primary entry point for new SaaS clients.
 */
export const registerOrganization = async (req, res) => {
    const { orgName, orgSlug, adminEmail, adminPassword, firstName, lastName } = req.body;

    try {
        // 1. Validate availability
        const existingOrg = await query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
        if (existingOrg.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Organization slug already taken.' });
        }

        const result = await withTenantContext(null, true, async (client) => {
            // 2. Create Organization (Default to Free tier)
            const orgResult = await client.query(
                `INSERT INTO organizations (name, slug, subscription_tier, subscription_status) 
                 VALUES ($1, $2, 'free', 'active') RETURNING id`,
                [orgName, orgSlug]
            );
            const orgId = orgResult.rows[0].id;

            // 3. Seed Core Roles (Admin, Faculty, Student)
            const roles = ['admin', 'faculty', 'student'];
            const roleMap = {};

            for (const roleName of roles) {
                const roleResult = await client.query(
                    'INSERT INTO roles (name, organization_id) VALUES ($1, $2) RETURNING id',
                    [roleName, orgId]
                );
                roleMap[roleName] = roleResult.rows[0].id;
            }

            // 4. Create Organization Owner
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [adminEmail, hashedPassword, firstName, lastName, roleMap['admin'], orgId]
            );

            return { orgId, userId: userResult.rows[0].id };
        });

        res.status(201).json({
            success: true,
            message: 'Organization registered successfully. Welcome to EduNexus!',
            data: {
                tenant: orgSlug,
                loginUrl: `http://${orgSlug}.edunexus.com/login`
            }
        });

    } catch (error) {
        console.error('Onboarding registry error:', error);
        res.status(500).json({ success: false, message: 'Error during organization registration.' });
    }
};

/**
 * Update Onboarding Progress (Internal Wizard)
 */
export const updateOnboardingStep = async (req, res) => {
    const { step, completed } = req.body;
    const orgId = req.user.orgId;

    try {
        await query(
            `UPDATE organizations 
             SET onboarding_metadata = onboarding_metadata || $1::jsonb
             WHERE id = $2`,
            [JSON.stringify({ [step]: completed, step }), orgId]
        );

        res.json({ success: true, message: `Onboarding step '${step}' updated.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating onboarding progress.' });
    }
};
