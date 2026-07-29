-- ============================================================================
-- SECURITY FIX (Lane D audit, P1-6)
-- ----------------------------------------------------------------------------
-- public.gamification_profiles' UPDATE policy only checks row ownership
-- (`auth.uid() = user_id`) with no WITH CHECK constraining the xp/streak
-- values, and `authenticated` holds a direct table-level UPDATE grant. Any
-- authenticated user can therefore run
--   update gamification_profiles set xp = 999999999 where user_id = auth.uid()
-- directly via PostgREST, completely bypassing award_xp()'s anti-cheat
-- logic and topping the leaderboard at will. 20260214000000 hardened the
-- award_xp()/update_streak() *functions* but never touched this table-level
-- grant/policy, so the direct-write path has remained open the whole time.
--
-- Fix: revoke direct client INSERT/UPDATE on gamification_profiles. All
-- mutation must go through award_xp()/update_streak(), which are already
-- SECURITY DEFINER + ownership-checked. SELECT (read of one's own row) is
-- left untouched.
-- ============================================================================

REVOKE INSERT, UPDATE ON public.gamification_profiles FROM authenticated;

DROP POLICY IF EXISTS "Users can insert their own gamification profile" ON public.gamification_profiles;
DROP POLICY IF EXISTS "Users can update their own gamification profile" ON public.gamification_profiles;

COMMENT ON TABLE public.gamification_profiles IS
  'SECURITY: authenticated has SELECT only. All xp/streak mutation must go '
  'through award_xp()/update_streak() (SECURITY DEFINER, ownership-checked). '
  'Direct client INSERT/UPDATE was revoked -- see Lane D audit P1-6.';
