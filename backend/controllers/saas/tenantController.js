import { query, withTenantContext } from '../../db/connection.js';
import bcrypt from 'bcrypt';

/**
 * Super Admin: Create New Tenant
 * Atomic operation: Create Org -> Seed Roles -> Create Admin
 */
export const createTenant = async (req, res) => {
    const { name, slug, adminEmail, adminPassword, firstName, lastName } = req.body;

    try {
        const result = await withTenantContext(null, true, async (client) => {
            // 1. Create Organization
            const orgResult = await client.query(
                'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
                [name, slug]
            );
            const orgId = orgResult.rows[0].id;

            // 2. Seed Default Roles for this Tenant
            // (In a real system, these would be in a separate template table)
            const roles = ['admin', 'faculty', 'student'];
            const roleMap = {};

            for (const roleName of roles) {
                const roleResult = await client.query(
                    'INSERT INTO roles (name, organization_id) VALUES ($1, $2) RETURNING id',
                    [roleName, orgId]
                );
                roleMap[roleName] = roleResult.rows[0].id;
            }

            // 3. Create Tenant Admin
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await client.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminEmail, hashedPassword, firstName, lastName, roleMap['admin'], orgId]
            );

            return { orgId, slug };
        });

        res.status(201).json({
            success: true,
            message: `Tenant '${name}' provisioned successfully.`,
            data: result
        });
    } catch (error) {
        console.error('Tenant provisioning error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Organization slug or admin email already exists.' });
        }
        res.status(500).json({ success: false, message: 'Error provisioning tenant.' });
    }
};

/**
 * Get All Tenants (Super Admin Only)
 */
export const getAllTenants = async (req, res) => {
    try {
        const result = await query('SELECT * FROM organizations ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenants.' });
    }
};

/**
 * Update Tenant Status (Suspend/Deactivate)
 */
export const updateTenantStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await query(
            'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
        );
        res.json({ success: true, message: `Tenant status updated to ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating tenant status.' });
    }
};
