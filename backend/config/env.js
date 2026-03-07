import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV}`;

console.log(`🔍 Loading env from: ${path.resolve(process.cwd(), envFile)}`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if environment-specific file doesn't exist/doesn't have everything
console.log(`🔍 Loading fallback env from: ${path.resolve(process.cwd(), '.env')}`);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Parse specialized flags
process.env.SAAS_MODE = process.env.SAAS_MODE === 'true';

console.log(`📡 Environment: ${NODE_ENV} | Config: ${envFile} | SaaS Mode: ${process.env.SAAS_MODE}`);

export default process.env;
