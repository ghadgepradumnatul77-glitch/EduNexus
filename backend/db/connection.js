import pg from 'pg';
import '../config/env.js';

const { Pool } = pg;

// 1. Tenant Application Pool (ENFORCED RLS)
// This pool MUST connect as a user with the 'tenant_role'
const tenantPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'edunexus',
  user: process.env.TENANT_DB_USER || 'postgres', // Falls back to postgres for local, but configured for tenant_role in prod
  password: process.env.TENANT_DB_PASSWORD || process.env.DB_PASSWORD,
  max: 20,
});

// 2. Platform Management Pool (BYPASS RLS)
// This pool MUST connect as a user with the 'platform_role'
const platformPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'edunexus',
  user: process.env.PLATFORM_DB_USER || 'postgres', // Falls back to postgres for local, but configured for platform_role in prod
  password: process.env.PLATFORM_DB_PASSWORD || process.env.DB_PASSWORD,
  max: 5,
});

// Primary Pool for migrations/maintenance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'edunexus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 2,
});

/**
 * Platform Query
 * Bypasses RLS by using the platformPool (connected as platform_role).
 * No runtime session variable required.
 */
export const platformQuery = async (text, params) => {
  const start = Date.now();
  try {
    const res = await platformPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_DB === 'true') {
      console.log(`Executed platform query`, { duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Platform query error:', error);
    throw error;
  }
};

/**
 * Standard Tenant Query
 * Strictly enforces RLS by using the tenantPool (connected as tenant_role).
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await tenantPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_DB === 'true') {
      console.log(`Executed tenant query`, { duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Tenant database query error:', error);
    throw error;
  }
};

/**
 * Localized Transaction Wrapper with Tenant Context
 * Explicitly sets the current tenant ID for RLS enforcement.
 */
export const withTenantContext = async (tenantId, callback) => {
  const client = await tenantPool.connect();
  try {
    await client.query('BEGIN');

    if (tenantId) {
      // Set localized tenant ID for RLS enforcement
      await client.query("SELECT set_config('app.current_tenant', $1, true)", [tenantId]);
    }

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Standard Transaction helper (tenant-bound)
export const transaction = async (callback) => {
  return withTenantContext(null, callback);
};

// Support for legacy patterns and custom client checkouts
export { tenantPool, platformPool, pool };
export const getClient = () => tenantPool.connect();
export const getPlatformClient = () => platformPool.connect();

export default tenantPool;
