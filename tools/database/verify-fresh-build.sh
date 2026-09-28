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

# Minimal Supabase-equivalent surface, including Supabase's default privileges
# on tables, sequences AND functions.
#
# BA-0060: this bootstrap used to omit the default EXECUTE grant on functions,
# on the stated grounds that two migrations' verification blocks would fail
# with it. That was not true, and the omission hid a real defect: migrations
# that revoke only FROM PUBLIC leave Supabase's direct anon grant in place, so
# the rate-limit store was anon-callable in any real Supabase project while
# this replay reported it locked. A replay that is more locked-down than the
# platform proves nothing about the platform.
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
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
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

# Post-build invariants. These run against the built catalogue, not migration
# text, so a later migration cannot quietly re-open what an earlier one closed.
invariants=$(psql_ -d "$DB" -tA -v ON_ERROR_STOP=1 <<'SQL'
-- BA-0060: no SECURITY DEFINER function in public may be executable by anon.
SELECT 'anon can execute definer function ' || p.oid::regprocedure
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
UNION ALL
-- BA-0059: passkey key material may only be written by the server.
SELECT 'client role can ' || lower(priv) || ' webauthn_credentials: ' || r
FROM unnest(ARRAY['anon', 'authenticated']) AS r,
     unnest(ARRAY['INSERT', 'UPDATE']) AS priv
WHERE has_table_privilege(r, 'public.webauthn_credentials', priv)
  AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'webauthn_credentials'
      AND cmd IN (priv, 'ALL') AND NOT (roles = ARRAY['service_role']::name[])
  )
UNION ALL
SELECT 'table grant ' || lower(priv) || ' on webauthn_credentials held by ' || r
FROM unnest(ARRAY['anon', 'authenticated']) AS r,
     unnest(ARRAY['INSERT', 'UPDATE']) AS priv
WHERE has_table_privilege(r, 'public.webauthn_credentials', priv);
SQL
)

if [ -n "$invariants" ]; then
  echo "FAIL: post-build security invariants violated:" >&2
  echo "$invariants" | sed 's/^/  /' >&2
  exit 1
fi

echo "OK: a working database can be built from supabase/migrations/ alone."
echo "OK: post-build security invariants hold (BA-0059, BA-0060)."
