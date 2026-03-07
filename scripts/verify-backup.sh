#!/bin/bash

# EduNexus Production DB Backup & Restore Verification Script
# This script ensures that backups are valid and restorable before running migrations.

DB_NAME=${DB_NAME:-edunexus}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_RESTORE_DB="edu_restore_test_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_DIR}/pre_migration_v_check_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Starting backup verification for database: ${DB_NAME}"

# 1. Take Backup
echo "Step 1: Creating backup..."
pg_dump -h "${DB_HOST:-localhost}" -U "${DB_USER}" -d "${DB_NAME}" -F c -f "${BACKUP_FILE}"

if [ $? -ne 0 ]; then
  echo "Error: pg_dump failed"
  exit 1
fi

echo "Backup created: ${BACKUP_FILE}"

# 2. Test Restore
echo "Step 2: Testing restoration to temporary DB: ${TEST_RESTORE_DB}..."
createdb -h "${DB_HOST:-localhost}" -U "${DB_USER}" "${TEST_RESTORE_DB}"

if [ $? -ne 0 ]; then
  echo "Error: Failed to create test restore database"
  exit 1
fi

pg_restore -h "${DB_HOST:-localhost}" -U "${DB_USER}" -d "${TEST_RESTORE_DB}" "${BACKUP_FILE}"

if [ $? -ne 0 ]; then
  echo "Error: pg_restore failed"
  # Cleanup before exit
  dropdb -h "${DB_HOST:-localhost}" -U "${DB_USER}" "${TEST_RESTORE_DB}"
  exit 1
fi

echo "Restoration successful."

# 3. Cleanup
echo "Step 3: Cleaning up temporary test DB..."
dropdb -h "${DB_HOST:-localhost}" -U "${DB_USER}" "${TEST_RESTORE_DB}"

echo "Verification complete: Backup is VALID."
exit 0
