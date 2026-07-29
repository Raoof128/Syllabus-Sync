-- ============================================================================
-- SECURITY FIX (Lane D audit, P1-9)
-- ----------------------------------------------------------------------------
-- 20260124000000_complete_schema_initialization.sql:338 added a client-facing
-- INSERT policy on public.xp_events ("Users can insert their own XP events",
-- WITH CHECK (auth.uid() = user_id)), bounded only by the table's own
-- `xp_amount > 0` / event_type-enum CHECK constraints. Combined with the
-- standing `GRANT INSERT ON xp_events TO authenticated`, any authenticated
-- user can self-insert fabricated xp_events rows directly, bypassing
-- award_xp()'s base-XP/streak-multiplier business logic and corrupting the
-- XP audit trail (this does not move gamification_profiles.xp directly, but
-- forges the historical log any admin tooling/analytics treats as truth).
--
-- Fix: xp_events must only ever be written by award_xp() (SECURITY DEFINER,
-- already ownership-checked). Revoke the direct client INSERT path.
-- ============================================================================

REVOKE INSERT ON public.xp_events FROM authenticated;

DROP POLICY IF EXISTS "Users can insert their own XP events" ON public.xp_events;
DROP POLICY IF EXISTS "Users can insert their own xp events" ON public.xp_events;

COMMENT ON TABLE public.xp_events IS
  'SECURITY: authenticated has SELECT only. All rows must be written by '
  'award_xp() (SECURITY DEFINER, ownership-checked). Direct client INSERT '
  'was revoked -- see Lane D audit P1-9.';
