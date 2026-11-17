-- ============================================================================
-- SECURITY FIX (Lane D audit, P0-3)
-- ----------------------------------------------------------------------------
-- mv_deadline_analytics, mv_user_activity_summary, mv_xp_leaderboard are
-- materialized views -- Postgres does not support RLS on materialized views.
-- They were GRANTed SELECT directly to `authenticated` (final grants at
-- 20260124000000_complete_schema_initialization.sql:410-412), so ANY
-- authenticated user can read every other user's email/name/xp/streak/
-- deadline counts/overdue counts. mv_xp_leaderboard's final redefinition also
-- dropped the earlier `LIMIT 100`, exposing the full roster instead of a
-- top-100 leaderboard.
--
-- Fix: revoke direct client SELECT on the materialized views and replace
-- with SECURITY DEFINER wrapper functions that scope results to the caller
-- (mv_deadline_analytics / mv_user_activity_summary) or intentionally return
-- a bounded leaderboard (mv_xp_leaderboard, LIMIT 100 restored).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='mv_deadline_analytics') THEN
    REVOKE SELECT ON public.mv_deadline_analytics FROM authenticated;
    REVOKE SELECT ON public.mv_deadline_analytics FROM anon;
    GRANT SELECT ON public.mv_deadline_analytics TO service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='mv_user_activity_summary') THEN
    REVOKE SELECT ON public.mv_user_activity_summary FROM authenticated;
    REVOKE SELECT ON public.mv_user_activity_summary FROM anon;
    GRANT SELECT ON public.mv_user_activity_summary TO service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='mv_xp_leaderboard') THEN
    REVOKE SELECT ON public.mv_xp_leaderboard FROM authenticated;
    REVOKE SELECT ON public.mv_xp_leaderboard FROM anon;
    GRANT SELECT ON public.mv_xp_leaderboard TO service_role;
  END IF;
END $$;

-- Caller-scoped wrapper for mv_deadline_analytics
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

-- Caller-scoped wrapper for mv_user_activity_summary
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

-- Bounded (top-100) leaderboard wrapper -- restores the LIMIT the final
-- mv_xp_leaderboard redefinition (20260124000000) had dropped.
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

COMMENT ON FUNCTION public.get_my_deadline_analytics() IS
  'RLS-safe replacement for direct SELECT on public.mv_deadline_analytics (matviews cannot carry RLS). Lane D audit P0-3.';
COMMENT ON FUNCTION public.get_my_activity_summary() IS
  'RLS-safe replacement for direct SELECT on public.mv_user_activity_summary (matviews cannot carry RLS). Lane D audit P0-3.';
COMMENT ON FUNCTION public.get_xp_leaderboard() IS
  'RLS-safe, bounded (top-100) replacement for direct SELECT on public.mv_xp_leaderboard. Lane D audit P0-3.';

-- NOTE for app maintainers: update client code that previously did
--   supabase.from('mv_deadline_analytics').select('*')
--   supabase.from('mv_user_activity_summary').select('*')
--   supabase.from('mv_xp_leaderboard').select('*')
-- to instead call
--   supabase.rpc('get_my_deadline_analytics')
--   supabase.rpc('get_my_activity_summary')
--   supabase.rpc('get_xp_leaderboard')
