-- BA-0022 (P0): ensure_user_profile() allows cross-user profile overwrite (IDOR).
--
-- `public.ensure_user_profile(p_user_id, p_email, p_full_name)` is
-- `SECURITY DEFINER` and `GRANT EXECUTE`d to `authenticated`
-- (20260109013302_disable_all_auth_triggers.sql), but never checks that the
-- caller is the same user as `p_user_id`. Any authenticated user can call
-- `supabase.rpc('ensure_user_profile', { p_user_id: '<victim>', p_email: 'x' })`
-- and overwrite the victim's `profiles.email`/`updated_at` via the
-- `ON CONFLICT DO UPDATE` branch (fires immediately since the victim's profile
-- already exists), and silently create a `gamification_profiles` row for them
-- if one didn't exist yet. Its sibling `create_user_profile()` from the same
-- era already does this check correctly.
--
-- No later migration redefines this function, so this is the effective state.
--
-- Idempotent: CREATE OR REPLACE FUNCTION; safe to re-run.

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
    -- service_role (trigger-driven signup flows, admin tooling) is exempt.
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

-- Grants are unchanged: authenticated still needs to call this for its own
-- account (e.g. as a signup fallback), service_role for trigger/admin paths.
REVOKE ALL ON FUNCTION public.ensure_user_profile(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO service_role;

-- Verification. Fails loudly rather than silently leaving the IDOR live.
DO $$
DECLARE
  fn_body text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO fn_body
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'ensure_user_profile';

  IF fn_body IS NULL THEN
    RAISE EXCEPTION 'BA-0022 verification failed: public.ensure_user_profile does not exist';
  END IF;

  IF fn_body !~* 'auth\.uid\(\)\s*IS\s+DISTINCT\s+FROM\s*p_user_id' THEN
    RAISE EXCEPTION 'BA-0022 verification failed: ensure_user_profile is missing its ownership check';
  END IF;
END
$$;
