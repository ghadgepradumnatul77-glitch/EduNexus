#!/bin/bash

# EduNexus Staging Migration Dry-Run Script
# Usage: ./verify-migration.sh ./backend/db/migrations/20260217_saas_isolation.sql

MIGRATION_FILE=$1
STAGING_DB="edu_staging_dry_run"
DB_USER=${DB_USER:-postgres}

if [ -z "$MIGRATION_FILE" ]; then
    echo "Usage: $0 <migration_file_path>"
    exit 1
fi

echo "🚀 Starting Dry-Run on Staging DB: ${STAGING_DB}"

# 1. Create Staging DB (Copy from current prod-schema if possible)
echo "1. Creating fresh staging database..."
dropdb -h localhost -U "${DB_USER}" --if-exists "${STAGING_DB}"
createdb -h localhost -U "${DB_USER}" "${STAGING_DB}"

# 2. Apply current schema
echo "2. Applying base schema..."
psql -h localhost -U "${DB_USER}" -d "${STAGING_DB}" -f ./backend/db/schema.sql

# 3. Apply the Migration
echo "3. Applying migration: ${MIGRATION_FILE}..."
psql -h localhost -U "${DB_USER}" -d "${STAGING_DB}" -f "${MIGRATION_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Migration Dry-Run SUCCESSFUL."
    
    # 4. Perform sanity checks
    echo "4. Running sanity checks..."
    
    # Check RLS enabled
    RLS_CHECK=$(psql -h localhost -U "${DB_USER}" -d "${STAGING_DB}" -t -c "SELECT relrowsecurity FROM pg_class WHERE relname = 'users';")
    if [[ "$RLS_CHECK" =~ "t" ]]; then
        echo "   - RLS is ENABLED on 'users' table."
    else
        echo "   - ❌ Error: RLS NOT enabled on 'users' table."
        exit 1
    fi

    # Check organization_id NOT NULL
    NULL_CHECK=$(psql -h localhost -U "${DB_USER}" -d "${STAGING_DB}" -t -c "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id';")
    if [[ "$NULL_CHECK" =~ "NO" ]]; then
        echo "   - organization_id is NOT NULL."
    else
        echo "   - ❌ Warning: organization_id is NULLABLE (Ensure backfill logic is added)."
    fi

    echo "🎉 Staging Verification Complete."
else
    echo "❌ Migration Dry-Run FAILED."
    exit 1
fi
