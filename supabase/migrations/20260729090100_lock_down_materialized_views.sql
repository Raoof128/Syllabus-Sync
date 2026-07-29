-- BA-0023 (P0): materialized views granted SELECT to authenticated expose
-- every user's analytics to every logged-in user.
--
-- `mv_deadline_analytics`, `mv_user_activity_summary` and `mv_xp_leaderboard`
-- are materialized views (20260114000000_add_missing_materialized_views.sql,
-- reiterated at 20260124000000_complete_schema_initialization.sql) granted
-- `SELECT` to `authenticated`. A materialized view is a physically-stored
-- snapshot: it does not consult the querying role's RLS policies on its
-- source tables at query time (it was already flattened at REFRESH time by a
-- definer/service-role context), and Postgres has no `security_invoker`
-- option for materialized views at all. Granting SELECT to `authenticated`
-- is therefore a direct, un-filterable grant of every row to every logged-in
-- user: per-user deadline/completion counts, activity telemetry, and the full
-- (not top-100) XP roster.
--
-- CORRECTION (verified against production 2026-07-29): `anon` holds the same
-- privileges, so the exposure is unauthenticated, not merely cross-user. A
-- plain `GET /rest/v1/mv_xp_leaderboard` carrying only the publishable anon
-- key shipped in the web bundle returned HTTP 200. It returned zero rows only
-- because these matviews have never been REFRESHed — the first refresh would
-- serve all 29 users' analytics to the open internet. Both roles additionally
-- hold INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES/MAINTAIN, which are
-- inert against a read-only matview but are noise that hides the real grant.
-- Revoke ALL from both client roles rather than SELECT from one.
--
-- The only correct remedy is to revoke the direct grant and serve the data
-- through SECURITY DEFINER functions that filter by auth.uid() (or, for the
-- leaderboard, reinstate an explicit bound instead of returning everyone).
--
-- Idempotent: REVOKE/GRANT and CREATE OR REPLACE are safe to re-run.

REVOKE ALL ON public.mv_deadline_analytics FROM anon, authenticated;
REVOKE ALL ON public.mv_user_activity_summary FROM anon, authenticated;
REVOKE ALL ON public.mv_xp_leaderboard FROM anon, authenticated;

GRANT SELECT ON public.mv_deadline_analytics TO service_role;
GRANT SELECT ON public.mv_user_activity_summary TO service_role;
GRANT SELECT ON public.mv_xp_leaderboard TO service_role;

-- Per-user deadline analytics, scoped to the caller.
CREATE OR REPLACE FUNCTION public.get_my_deadline_analytics()
RETURNS SETOF public.mv_deadline_analytics
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_deadline_analytics WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_deadline_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_deadline_analytics() TO authenticated;

-- Per-user activity summary, scoped to the caller.
CREATE OR REPLACE FUNCTION public.get_my_activity_summary()
RETURNS SETOF public.mv_user_activity_summary
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_user_activity_summary WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_activity_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_activity_summary() TO authenticated;

-- Leaderboard is intentionally cross-user, but must be bounded rather than
-- returning the entire roster (the original LIMIT 100 was dropped when this
-- matview was redefined at 20260124000000).
CREATE OR REPLACE FUNCTION public.get_xp_leaderboard()
RETURNS SETOF public.mv_xp_leaderboard
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_xp_leaderboard ORDER BY rank LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.get_xp_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_xp_leaderboard() TO authenticated;

-- Verification. Fails loudly rather than silently leaving the grant live.
--
-- information_schema.role_table_grants does NOT cover materialized views
-- (relkind = 'm' is excluded from information_schema.tables), so it would
-- silently report no offenders even if the REVOKE above never ran. Read the
-- ACL directly off pg_class instead.
DO $$
DECLARE
  offending text;
BEGIN
  SELECT string_agg(DISTINCT c.relname || ' (' || r.rolname || ')', ', ')
  INTO offending
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
  JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relkind = 'm'
    AND c.relname IN ('mv_deadline_analytics', 'mv_user_activity_summary', 'mv_xp_leaderboard')
    AND r.rolname IN ('anon', 'authenticated');

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0023 verification failed: client roles still hold privileges on: %', offending;
  END IF;
END
$$;
