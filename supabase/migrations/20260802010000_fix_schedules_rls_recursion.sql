-- BA-0052 (P1): mutually recursive RLS policies make public.schedules and
-- public.schedule_members permanently unqueryable.
--
-- 20260220100000_realtime_offline.sql created a policy cycle:
--
--   schedules."Users can view shared schedules"
--     USING (id IN (SELECT schedule_id FROM public.schedule_members WHERE user_id = auth.uid()))
--
--   schedule_members."Schedule owners can view all members"
--     USING (schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid()))
--
-- Selecting from either table evaluates the other table's policies, which
-- evaluate the first table's policies again. PostgreSQL aborts the whole
-- statement with 42P17 "infinite recursion detected in policy for relation".
--
-- This is not latent. Verified against production on 2026-08-02 via PostgREST
-- with the anon key -- both tables return HTTP 500 / 42P17 -- and reproduced
-- locally against a clean PostgreSQL 15.18 for the `authenticated` role, so it
-- affects every signed-in user, not just anonymous callers. Both tables have
-- been unreadable and unwritable since 2026-02-20.
--
-- Blast radius in application code: app/api/sync/route.ts:139 looks up
-- schedule_members to decide whether the caller may edit an event belonging to
-- a shared schedule. That call destructures only `data` and discards `error`,
-- so the 42P17 failure is swallowed and `membership` becomes null. The check
-- then fails CLOSED (a genuine collaborator is refused with 403) rather than
-- open, so this is an availability and correctness defect, not a privilege
-- escalation. It is silent: nothing is logged and no alert fires.
--
-- Fix: break the cycle with two SECURITY DEFINER helpers. A SECURITY DEFINER
-- function runs as its owner and is therefore not subject to the caller's RLS
-- policies, so the cross-table lookup no longer re-enters policy evaluation.
--
-- These helpers are safe against the IDOR class that BA-0029/BA-0031/BA-0049
-- covered: neither accepts a user identifier. Both answer only "does the
-- CURRENT caller (auth.uid()) stand in this relationship to this schedule?",
-- so a caller cannot ask about anybody else. search_path is pinned to defeat
-- search_path-hijacking of a SECURITY DEFINER body.
--
-- Idempotent: CREATE OR REPLACE FUNCTION and DROP POLICY IF EXISTS followed by
-- CREATE POLICY are safe to re-run.

-- ============================================================================
-- 1. Non-recursive membership helpers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_schedule_member(p_schedule_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    WHERE sm.schedule_id = p_schedule_id
      AND sm.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_schedule_member(uuid) IS
  'Returns true when the CURRENT caller is a member of the given schedule. '
  'SECURITY DEFINER so that RLS policies can call it without re-entering '
  'policy evaluation (BA-0052). Takes no user id, so it cannot be used to '
  'probe another user''s memberships.';

CREATE OR REPLACE FUNCTION public.owns_schedule(p_schedule_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = p_schedule_id
      AND s.owner_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.owns_schedule(uuid) IS
  'Returns true when the CURRENT caller owns the given schedule. '
  'SECURITY DEFINER for the same reason as is_schedule_member (BA-0052).';

-- PostgreSQL evaluates functions referenced in an RLS policy as the CALLING
-- role and enforces EXECUTE privilege on them, so `authenticated` must hold
-- EXECUTE or every query against these tables fails with 42501 instead of
-- 42P17 -- trading one breakage for another. (Verified empirically: granting
-- only service_role produced "permission denied for function
-- is_schedule_member" for authenticated.)
--
-- Granting EXECUTE is safe here precisely because of the no-user-id design
-- above: the only question a caller can ask is about its own relationship to a
-- schedule id, which it may already determine from its own rows.
--
-- anon is granted too, and that is deliberate. Excluding it was tried first and
-- was worse: anon holds the table-level SELECT grant (BA-0055), so its query
-- still reaches policy evaluation, which then calls these functions and fails
-- with `42501 permission denied for function is_schedule_member` -- verified
-- against production. That trades a 500 for a 401 instead of the correct
-- answer. With the grant, auth.uid() is NULL for anon, both functions return
-- false, and anon gets what RLS is supposed to give it: zero rows, no error.
-- Nothing is disclosed either way; this is the honest empty result.
REVOKE EXECUTE ON FUNCTION public.is_schedule_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_schedule(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_schedule_member(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_schedule(uuid) TO anon, authenticated, service_role;

-- ============================================================================
-- 2. Rebuild the two policies that formed the cycle
-- ============================================================================
-- Only the cross-referencing policies are replaced. The same-table policies
-- ("Users can view own schedules", "Members can view their memberships", and
-- the INSERT/UPDATE/DELETE policies) never recursed and are left untouched,
-- except the schedule_members write policies which also cross-reference
-- schedules and would recurse the moment a schedules policy reads members.

DROP POLICY IF EXISTS "Users can view shared schedules" ON public.schedules;
CREATE POLICY "Users can view shared schedules"
  ON public.schedules FOR SELECT
  USING (public.is_schedule_member(id));

DROP POLICY IF EXISTS "Schedule owners can view all members" ON public.schedule_members;
CREATE POLICY "Schedule owners can view all members"
  ON public.schedule_members FOR SELECT
  USING (public.owns_schedule(schedule_id));

DROP POLICY IF EXISTS "Schedule owners can manage members" ON public.schedule_members;
CREATE POLICY "Schedule owners can manage members"
  ON public.schedule_members FOR INSERT
  WITH CHECK (public.owns_schedule(schedule_id));

-- Preserves the BA-0026 hardening from
-- 20260729090300_fix_gamification_and_schedule_tampering.sql: an owner may
-- update a membership row but may not promote anyone to 'owner'.
DROP POLICY IF EXISTS "Schedule owners can update members" ON public.schedule_members;
CREATE POLICY "Schedule owners can update members"
  ON public.schedule_members FOR UPDATE
  USING (public.owns_schedule(schedule_id))
  WITH CHECK (
    public.owns_schedule(schedule_id)
    AND role <> 'owner'
  );

DROP POLICY IF EXISTS "Schedule owners can remove members" ON public.schedule_members;
CREATE POLICY "Schedule owners can remove members"
  ON public.schedule_members FOR DELETE
  USING (public.owns_schedule(schedule_id));

-- ============================================================================
-- 3. Verification -- fails loudly rather than leaving the tables unqueryable
-- ============================================================================
-- Run as a non-superuser role so RLS is actually applied. A superuser bypasses
-- RLS and would make this check vacuous.

DO $$
DECLARE
  n bigint;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub',
                     '00000000-0000-4000-8000-0000000000ff', true);

  -- Both statements raise 42P17 if the cycle is still present.
  SELECT count(*) INTO n FROM public.schedules;
  SELECT count(*) INTO n FROM public.schedule_members;

  RESET ROLE;
EXCEPTION
  WHEN OTHERS THEN
    RESET ROLE;
    RAISE EXCEPTION
      'BA-0052 verification failed: schedules/schedule_members still not queryable under RLS (SQLSTATE %: %)',
      SQLSTATE, SQLERRM;
END
$$;
