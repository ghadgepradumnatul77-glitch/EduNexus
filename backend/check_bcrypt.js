import bcrypt from 'bcrypt';

const password = 'Admin@123';
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWeCrHu.';

const result = await bcrypt.compare(password, hash);
console.log('Password match:', result);
process.exit(0);
