import bcrypt from 'bcrypt';

const password = 'Admin@123';
const hash = await bcrypt.hash(password, 12);
console.log('New hash:', hash);
process.exit(0);
