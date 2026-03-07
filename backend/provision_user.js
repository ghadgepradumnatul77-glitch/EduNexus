import { query } from './db/connection.js';
import bcrypt from 'bcrypt';

async function provisionUser() {
    const email = 'pradumnghadge121@gmail.com';
    const password = 'Pr@dumn121';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // 1. Get Organization ID (Demo)
        const orgRes = await query("SELECT id FROM organizations WHERE slug = 'demo' LIMIT 1");
        if (orgRes.rows.length === 0) {
            console.error('Demo organization not found');
            process.exit(1);
        }
        const orgId = orgRes.rows[0].id;

        // 2. Get Role IDs
        const rolesRes = await query("SELECT id, name FROM roles WHERE name IN ('Student', 'Admin', 'student', 'admin')");
        const studentRole = rolesRes.rows.find(r => r.name.toLowerCase() === 'student');
        const adminRole = rolesRes.rows.find(r => r.name.toLowerCase() === 'admin');

        if (!studentRole) {
            console.error('Student role not found');
            process.exit(1);
        }

        // 3. Insert Student Account
        // Note: If email is unique, we add student role first.
        // If user wants this same email for Admin, we can update it or 
        // create a separate email if unique constraint prevents it.
        const checkUser = await query("SELECT id FROM users WHERE email = $1", [email]);

        if (checkUser.rows.length > 0) {
            console.log('User already exists, updating to Student role...');
            await query(
                "UPDATE users SET password_hash = $1, role_id = $2, first_name = 'Pradumn', last_name = 'Ghadge' WHERE email = $3",
                [hashedPassword, studentRole.id, email]
            );
        } else {
            console.log('Creating new Student account...');
            await query(
                "INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id) VALUES ($1, $2, 'Pradumn', 'Ghadge', $3, $4)",
                [email, hashedPassword, studentRole.id, orgId]
            );
        }

        console.log(`✅ Student Access Provisioned: ${email} / ${password}`);

        // 4. Provision Admin Access
        // Since the user asked for Admin too, but the system likely uses one role per email,
        // I will create a dedicated admin email for them to test both roles.
        const adminEmail = 'admin.pradumn@pcu.edu.in';
        if (adminRole) {
            const checkAdmin = await query("SELECT id FROM users WHERE email = $1", [adminEmail]);
            if (checkAdmin.rows.length > 0) {
                await query(
                    "UPDATE users SET password_hash = $1, role_id = $2 WHERE email = $3",
                    [hashedPassword, adminRole.id, adminEmail]
                );
            } else {
                await query(
                    "INSERT INTO users (email, password_hash, first_name, last_name, role_id, organization_id) VALUES ($1, $2, 'Pradumn', 'Admin', $3, $4)",
                    [adminEmail, hashedPassword, adminRole.id, orgId]
                );
            }
            console.log(`✅ Admin Access Provisioned: ${adminEmail} / ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Provisioning failed:', error);
        process.exit(1);
    }
}

provisionUser();
