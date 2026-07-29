-- ============================================================================
-- SECURITY FIX (Lane D audit, P0-2)
-- ----------------------------------------------------------------------------
-- public.ensure_user_profile(p_user_id, p_email, p_full_name) is SECURITY
-- DEFINER, GRANTed EXECUTE to `authenticated`, and has NEVER checked that the
-- caller owns p_user_id. Any authenticated user can call it with a victim's
-- uuid to overwrite that victim's profiles.email/updated_at (via the
-- ON CONFLICT (id) DO UPDATE branch) and/or create a gamification_profiles
-- row for them. Introduced 20260109013302, never patched since.
--
-- Fix: add the same ownership check already used by its sibling functions
-- (create_user_profile, create_unit_with_schedule, clear_user_data). Function
-- is kept (rather than dropped) since app code may still call it for
-- idempotent post-signup profile creation; the trigger-based path
-- (handle_new_user / handle_new_user_safe) already covers the common case,
-- and service_role retains unrestricted access for backend/admin use.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Authenticated callers may only create/update their own profile.
    -- service_role (auth.role() <> 'authenticated') is unrestricted for
    -- backend/admin use (e.g. post-signup provisioning jobs).
    IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Unauthorized profile write attempt' USING ERRCODE = '42501';
    END IF;

    -- Insert profile if it doesn't exist
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (p_user_id, p_email, COALESCE(p_full_name, ''), NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    -- Insert gamification profile if it doesn't exist
    INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, created_at, updated_at)
    VALUES (p_user_id, 0, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO service_role;
