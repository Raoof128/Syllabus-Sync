-- ============================================================================
-- HYGIENE FIX (Lane D audit, P3-23)
-- ----------------------------------------------------------------------------
-- Two AFTER INSERT triggers on auth.users currently coexist and both fire on
-- every signup:
--   1. on_auth_user_created_safe -> handle_new_user_safe()   (20260113000000 /
--      redefined 20260114011650) -- inserts profiles AND gamification_profiles,
--      wrapped in a function-level `EXCEPTION WHEN OTHERS THEN RAISE WARNING`
--      that silently swallows any failure, including in the
--      gamification_profiles insert.
--   2. on_auth_user_created -> handle_new_user()             (20260314) --
--      inserts profiles only, SET search_path = '' (the strictest hardening
--      pattern in this codebase), no error-swallowing.
--
-- This is redundant double work per signup, and handle_new_user_safe's
-- blanket exception handler can mask a real failure. Since award_xp()
-- already lazily creates a gamification_profiles row on first XP award
-- (`INSERT ... ON CONFLICT (user_id) DO NOTHING`, see
-- 20260406000700_harden_award_xp_atomicity_and_dedup.sql and the pre-existing
-- award_xp/update_streak bodies), dropping the older, more permissive
-- trigger/function and keeping only the newer, stricter one is safe: new
-- users still get a gamification_profiles row lazily on their first XP
-- event, and no longer risk a silently-swallowed profile-creation failure.
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_safe();

-- Ensure the surviving trigger/function is present and correctly bound
-- (idempotent re-affirmation; matches 20260314_auto_create_profile_trigger.sql).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Sole AFTER INSERT ON auth.users trigger function (see Lane D audit P3-23 -- '
  'the older handle_new_user_safe()/on_auth_user_created_safe duplicate was '
  'removed). gamification_profiles rows are created lazily by award_xp() on '
  'first XP event, not eagerly here.';
