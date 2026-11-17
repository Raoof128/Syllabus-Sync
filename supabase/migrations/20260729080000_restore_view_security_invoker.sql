-- BA-0021 (P0): restore security_invoker on public views.
--
-- A Postgres view created without `security_invoker = true` executes with the
-- privileges of the view's OWNER, not the caller. Row Level Security on the
-- underlying tables is therefore bypassed for anyone holding SELECT on the view.
--
-- `public.user_details` selects from `public.profiles` joined to
-- `public.gamification_profiles` and is granted to `authenticated`. With the
-- flag missing, any authenticated user could read every user's email, full
-- name, student_id, faculty, course, year and XP.
--
-- This regressed twice. The flag was set in 20260113000000, lost, restored in
-- 20260226000000 (which recreated the view WITH the option), then lost again in
-- 20260304100000, which did DROP VIEW + CREATE VIEW to add the `faculty` column
-- and did not carry the option forward. That last definition is the effective
-- state, so the exposure has been live since.
--
-- Rather than name individual views and risk missing one, this asks the catalog
-- which views in `public` currently lack the option and fixes each. That also
-- covers `public.recent_audit_activity`, created without the option in
-- 20260129000000.
--
-- Idempotent: re-running is a no-op once every view carries the option.
-- Rollback: `ALTER VIEW <name> RESET (security_invoker);` per view — though
-- doing so reintroduces the exposure and should not be done.
--
-- NOTE: materialized views cannot carry RLS or `security_invoker` at all. They
-- are deliberately untouched here; the exposure via `mv_*` objects granted to
-- `authenticated` is tracked separately as BA-0023 and needs a different remedy
-- (revoking the grant and serving them through a security-invoker view or an
-- RPC that filters by `auth.uid()`).

DO $$
DECLARE
  target record;
  fixed_count integer := 0;
BEGIN
  FOR target IN
    SELECT c.oid::regclass AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND NOT COALESCE(
        (
          SELECT option_value::boolean
          FROM pg_options_to_table(c.reloptions)
          WHERE option_name = 'security_invoker'
        ),
        false
      )
  LOOP
    EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', target.view_name);
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'BA-0021: set security_invoker on %', target.view_name;
  END LOOP;

  RAISE NOTICE 'BA-0021: % view(s) updated', fixed_count;
END
$$;

-- Verification. Fails loudly rather than silently leaving an exposed view.
DO $$
DECLARE
  offending text;
BEGIN
  SELECT string_agg(c.oid::regclass::text, ', ')
  INTO offending
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND NOT COALESCE(
      (
        SELECT option_value::boolean
        FROM pg_options_to_table(c.reloptions)
        WHERE option_name = 'security_invoker'
      ),
      false
    );

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0021 verification failed: views still bypassing RLS: %', offending;
  END IF;
END
$$;
