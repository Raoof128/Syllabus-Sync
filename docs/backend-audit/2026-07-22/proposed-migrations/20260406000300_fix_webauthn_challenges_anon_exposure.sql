-- ============================================================================
-- SECURITY FIX (Lane D audit, P0-5, plus P3-22 index)
-- ----------------------------------------------------------------------------
-- public.webauthn_challenges' SELECT/INSERT/DELETE policies use
-- `auth.uid() = user_id OR user_id IS NULL` with NO `TO authenticated`
-- clause, so they apply to PUBLIC -- including the `anon` role, whose key is
-- shipped in every client bundle. Any unauthenticated visitor can read or
-- delete every in-flight (user_id IS NULL) pre-auth WebAuthn challenge row
-- belonging to ANY user currently registering/logging in with a passkey --
-- no account required. Introduced 20260207000000, faithfully re-created
-- (not fixed) by the 20260214003000 "restore missing tables" migration.
--
-- Fix: restrict the policies to `TO authenticated` and to the caller's own
-- rows only. Pre-authentication (user_id IS NULL) challenges must no longer
-- be directly readable/writable by REST clients at all; they should be
-- minted and validated exclusively through SECURITY DEFINER RPCs that check
-- an opaque, single-use challenge id/token rather than relying on RLS row
-- visibility for a not-yet-authenticated actor. This migration closes the
-- anon exposure immediately; the RPC-based pre-auth flow is a follow-up
-- application-layer change flagged in the comment below for the app team.
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON public.webauthn_challenges;

CREATE POLICY "Users can view own challenges"
  ON public.webauthn_challenges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON public.webauthn_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON public.webauthn_challenges
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Explicitly ensure anon has no table-level access either (defense in depth
-- beyond the policy TO-clause change above).
REVOKE ALL ON public.webauthn_challenges FROM anon;

-- Index for the (now mandatory) user_id predicate used by every policy above.
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON public.webauthn_challenges(user_id);

COMMENT ON TABLE public.webauthn_challenges IS
  'SECURITY: pre-authentication (user_id IS NULL) challenge rows are no '
  'longer directly readable/writable by any REST client (see Lane D audit '
  'P0-5). The registration/login-start flow that used to rely on public '
  'SELECT/INSERT of a NULL-owner row must be moved behind a SECURITY '
  'DEFINER RPC (e.g. begin_webauthn_registration()/begin_webauthn_login()) '
  'that mints an opaque, single-use, time-boxed challenge server-side and '
  'validates it server-side on completion, instead of relying on RLS row '
  'visibility for a not-yet-authenticated caller. Application-layer '
  'follow-up required if the client currently talks to this table directly '
  'during the pre-auth phase.';
