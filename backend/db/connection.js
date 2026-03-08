import pg from 'pg';
import '../config/env.js';

const { Pool } = pg;

// Support for individual components or a full connection string (standard for Render/Heroku)
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'edunexus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  };

// 1. SSL Configuration for Production (Render/Managed DBs)
const ssl = (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true')
  ? { rejectUnauthorized: false }
  : null;

if (ssl) {
  console.log('🔒 [DB-INIT] SSL: Enabled (Production Mode)');
} else {
  console.log('🔓 [DB-INIT] SSL: Disabled');
}

// 2. Base Configuration Factory
const createConfig = (customUser, customPass, max = 20) => {
  const config = connectionString
    ? { connectionString }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'edunexus',
      user: customUser || process.env.DB_USER || 'postgres',
      password: customPass || process.env.DB_PASSWORD,
    };

  config.max = max;
  if (ssl) config.ssl = ssl;
  return config;
};

// 1. Tenant Application Pool (ENFORCED RLS)
const tenantPool = new Pool(createConfig(process.env.TENANT_DB_USER, process.env.TENANT_DB_PASSWORD, 20));

// 2. Platform Management Pool (BYPASS RLS)
const platformPool = new Pool(createConfig(process.env.PLATFORM_DB_USER, process.env.PLATFORM_DB_PASSWORD, 5));

// Primary Pool for migrations/maintenance (Matches base defaults)
const pool = new Pool(createConfig(null, null, 2));

export const platformQuery = async (text, params) => {
  const start = Date.now();
  const client = await platformPool.connect();
  try {
    // Explicit bypass for managed environments
    await client.query("SELECT set_config('app.is_superadmin', 'true', true)");

    const res = await client.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_DB === 'true') {
      console.log(`Executed platform query`, { duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Platform query error:', error);
    throw error;
  } finally {
    client.release();
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
