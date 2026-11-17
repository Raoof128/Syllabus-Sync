-- ============================================================================
-- SECURITY FIX (Lane D audit, P0-1 / P0-4)
-- ----------------------------------------------------------------------------
-- public.user_details lost `security_invoker = true` TWICE across migration
-- history (fixed 20260113000000, broken 20260114011650, fixed 20260226000000,
-- broken again 20260304100000 -- the last migration to touch the view).
-- Without security_invoker, a plain view executes with the VIEW OWNER's
-- privileges (the migration-runner role, which has BYPASSRLS on Supabase),
-- not the querying user's -- so RLS on profiles/gamification_profiles is
-- bypassed and every authenticated user can read every other user's email,
-- full_name, student_id, faculty, course, year, avatar_url, xp, streak, level.
--
-- public.recent_audit_activity / public.security_audit_events never had
-- security_invoker set at all, plausibly exposing every user's full audit
-- trail (ip_address, user_agent, old_data/new_data) to any authenticated user,
-- even though the underlying audit_logs table's own RLS policy correctly
-- scopes to auth.uid().
--
-- Using ALTER VIEW ... SET (security_invoker = true) rather than DROP/CREATE
-- to avoid touching column lists (risk of typos) and to avoid cascading into
-- dependent objects (public.get_my_profile() selects from user_details).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_details') THEN
    ALTER VIEW public.user_details SET (security_invoker = true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'recent_audit_activity') THEN
    ALTER VIEW public.recent_audit_activity SET (security_invoker = true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'security_audit_events') THEN
    ALTER VIEW public.security_audit_events SET (security_invoker = true);
  END IF;
END $$;

-- Regression guard: record intent in a comment so future "add a column to this
-- view" migrations don't repeat the DROP/CREATE-without-security_invoker
-- mistake a third time.
COMMENT ON VIEW public.user_details IS
  'SECURITY: must always carry (security_invoker = true). If you DROP/CREATE '
  'this view to add a column, re-add WITH (security_invoker = true) or run '
  'ALTER VIEW public.user_details SET (security_invoker = true) immediately after.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'recent_audit_activity') THEN
    COMMENT ON VIEW public.recent_audit_activity IS
      'SECURITY: must always carry (security_invoker = true) -- see Lane D audit P0-4.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'security_audit_events') THEN
    COMMENT ON VIEW public.security_audit_events IS
      'SECURITY: must always carry (security_invoker = true) -- see Lane D audit P0-4.';
  END IF;
END $$;
