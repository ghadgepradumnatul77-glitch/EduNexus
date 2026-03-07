import bcrypt from 'bcrypt';
import { query } from '../db/connection.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Get all users (with pagination and filtering)
export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const role = req.query.role;
        const search = req.query.search;

        let queryText = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.last_login_at, 
             u.created_at, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.is_deleted = FALSE
    `;
        const params = [];
        let paramCount = 1;

        if (role) {
            queryText += ` AND r.name = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        if (search) {
            queryText += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        queryText += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.is_deleted = FALSE`;
        const countParams = [];

        if (role) {
            countQuery += ' AND r.name = $1';
            countParams.push(role);
        }

        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: {
                users: result.rows.map(user => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    lastLoginAt: user.last_login_at,
                    createdAt: user.created_at
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.last_login_at, 
              u.last_login_ip, u.created_at, r.name as role, r.id as role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_deleted = FALSE`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                roleId: user.role_id,
                lastLoginAt: user.last_login_at,
                lastLoginIp: user.last_login_ip,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create user
export const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, roleId } = req.body;

        // Check if email already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, created_at`,
            [email, passwordHash, firstName, lastName, roleId, req.user.id]
        );

        const newUser = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                createdAt: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { email, firstName, lastName, roleId } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const existingUser = await query(
            'SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE',
            [userId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is taken by another user
        if (email) {
            const emailCheck = await query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (email) {
            updates.push(`email = $${paramCount}`);
            params.push(email);
            paramCount++;
        }
        if (firstName) {
            updates.push(`first_name = $${paramCount}`);
            params.push(firstName);
            paramCount++;
        }
        if (lastName) {
            updates.push(`last_name = $${paramCount}`);
            params.push(lastName);
            paramCount++;
        }
        if (roleId) {
            updates.push(`role_id = $${paramCount}`);
            params.push(roleId);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push(`updated_by = $${paramCount}`);
        params.push(req.user.id);
        paramCount++;

        params.push(userId);

        const result = await query(
            `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, updated_at`,
            params
        );

        const updatedUser = result.rows[0];

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                updatedAt: updatedUser.updated_at
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Soft delete user
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const existingUser = await query(
            'SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE',
            [userId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Soft delete
        await query(
            `UPDATE users 
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_by = $1
       WHERE id = $2`,
            [req.user.id, userId]
        );

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all roles
export const getRoles = async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, description FROM roles ORDER BY name'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
