/**
 * Enterprise Environment Validator
 * Ensures all critical secrets are present and meet minimum security standards before boot.
 */
export const validateEnv = () => {
    const required = [
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'PLATFORM_JWT_SECRET'
    ];

    // Check for either DATABASE_URL OR individual components
    const hasConnectionStr = !!process.env.DATABASE_URL;
    const hasDbComponents = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].every(key => !!process.env[key]);

    if (!hasConnectionStr && !hasDbComponents) {
        console.error('❌ CRITICAL: Missing database configuration. Provide either DATABASE_URL or DB_HOST/NAME/USER/PASS.');
        process.exit(1);
    }

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ CRITICAL: Missing required security environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Secret length validation
    const secrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'PLATFORM_JWT_SECRET'];
    secrets.forEach(key => {
        if (process.env[key].length < 32) {
            console.warn(`⚠️ WARNING: ${key} is less than 32 characters. Enterprise grade requires 32+ char secrets.`);
        }
    });

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }

    console.log(`✅ Environment validated (${process.env.NODE_ENV})`);
};
