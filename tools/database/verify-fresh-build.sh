#!/usr/bin/env bash
# Build a database from supabase/migrations/ alone and fail if any migration errors.
#
# BA-0053: no pass of this project had ever replayed the migration set against an
# empty database. Doing so on 2026-08-02 found 6 of 78 migrations fatally broken,
# including two independent errors in a single file that made it impossible to
# apply on any PostgreSQL version. The consequence was that there was no
# reproducible path to a new environment, and therefore no tested recovery path.
#
# This script exists so that can never again be true without CI saying so.
#
# Requires a local PostgreSQL (>= 15) on PGPORT. Creates and drops its own
# throwaway database; it never touches a remote or production instance.
#
# Usage:  tools/database/verify-fresh-build.sh
# Env:    PGHOST (default 127.0.0.1), PGPORT (default 55432), PGUSER (default postgres)

set -euo pipefail

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-55432}"
PGUSER="${PGUSER:-postgres}"
DB="syllabus_sync_freshbuild_$$"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/supabase/migrations"

psql_() { psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$@"; }

cleanup() {
  psql_ -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT

if ! command -v psql >/dev/null 2>&1; then
  echo "FAIL: psql not on PATH. On macOS/Homebrew:" >&2
  echo '  export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >&2
  exit 2
fi

if ! psql_ -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
  echo "FAIL: psql found, but no PostgreSQL reachable at $PGHOST:$PGPORT" >&2
  exit 2
fi

psql_ -d postgres -q -c "CREATE DATABASE $DB;"

# Minimal Supabase-equivalent surface. Deliberately does NOT grant blanket
# EXECUTE on functions to anon: two migrations revoke only FROM PUBLIC, which
# would not remove a direct anon grant (the same defect class as BA-0055), and
# their own verification blocks correctly fail if that grant is present.
psql_ -d "$DB" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN CREATE ROLE anon NOLOGIN NOINHERIT;                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN NOINHERIT;           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticator NOINHERIT LOGIN;             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE supabase_admin SUPERUSER;                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT anon, authenticated, service_role TO authenticator;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE,
  encrypted_password text, email_confirmed_at timestamptz,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb, raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz, last_sign_in_at timestamptz, phone text);
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[], owner uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz, path_tokens text[], metadata jsonb);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $f$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $f$ SELECT nullif(current_setting('request.jwt.claim.role', true), '')::text $f$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS
  $f$ SELECT nullif(current_setting('request.jwt.claim.email', true), '')::text $f$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  $f$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $f$;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
  $f$ SELECT string_to_array(name, '/') $f$;
CREATE OR REPLACE FUNCTION storage.filename(name text) RETURNS text LANGUAGE sql IMMUTABLE AS
  $f$ SELECT split_part(name, '/', -1) $f$;
CREATE OR REPLACE FUNCTION storage.extension(name text) RETURNS text LANGUAGE sql IMMUTABLE AS
  $f$ SELECT split_part(name, '.', -1) $f$;
GRANT USAGE ON SCHEMA public, auth, storage, extensions TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
CREATE PUBLICATION supabase_realtime;
SQL

applied=0
failed=0
failures=""

for f in "$MIGRATIONS_DIR"/*.sql; do
  if out=$(psql_ -d "$DB" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1); then
    applied=$((applied + 1))
  else
    failed=$((failed + 1))
    failures+=$'\n  '"$(basename "$f")"$'\n    '"$(echo "$out" | grep -m1 ERROR || echo "$out" | head -1)"
  fi
done

total=$((applied + failed))
echo "fresh build from migrations: applied=$applied failed=$failed total=$total"

if [ "$failed" -ne 0 ]; then
  echo "FAIL: the migration set cannot build an empty database.$failures" >&2
  exit 1
fi

echo "OK: a working database can be built from supabase/migrations/ alone."
