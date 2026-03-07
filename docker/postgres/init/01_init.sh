#!/bin/bash
# ============================================================
# EduNexus — PostgreSQL Docker Init Script
# Runs automatically on FIRST container boot (empty volume).
# On subsequent starts this script is skipped by Postgres.
# ============================================================
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 EduNexus — Initialising Database Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DB="edunexus"
USER="edunexus_user"

run_sql() {
  local file="$1"
  echo "  ↳  Applying: $(basename $file)"
  psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" -f "$file"
}

# 1. Core schema (schema.sql mounted at /schema.sql)
run_sql /schema.sql

# 2. Ordered migrations (all .sql files in /migrations, sorted)
#    Mounted from ./backend/db/migrations
for f in $(ls /migrations/*.sql | sort); do
  run_sql "$f"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  All migrations applied. Database is ready."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
