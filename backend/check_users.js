import { query } from './db/connection.js';

const res = await query('SELECT email, password_hash FROM users');
console.log('Users in DB:', res.rows);
process.exit(0);
