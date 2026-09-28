-- BA-0059 (P1): passkey key material is writable without a WebAuthn ceremony.
--
-- BA-0002 closed one way of planting a public key (POST /api/auth/biometric
-- accepted it from the request body). It did not close the underlying door:
-- the table that /api/webauthn/authenticate/verify trusts to mint a session was
-- itself directly writable by the credential owner.
--
-- 20260207000000 and 20260214003000 created
--   "Users can insert own credentials"  FOR INSERT WITH CHECK (auth.uid() = user_id)
--   "Users can update own credentials"  FOR UPDATE USING      (auth.uid() = user_id)
-- and no later migration touched either. So anyone holding a user's access
-- token (a stolen cookie, XSS, an unlocked laptop) could call
--   POST  /rest/v1/webauthn_credentials   {user_id, credential_id, public_key}
--   PATCH /rest/v1/webauthn_credentials?id=eq.<id>   {public_key: ...}
-- with the public anon key, supply a key pair generated in software, and from
-- then on sign passkey assertions for that account. No challenge, no
-- attestation, no rate limit, no AAL2 gate — and the credential survives a
-- password reset and "sign out everywhere".
--
-- Writes now go only through the server, after verifyRegistrationResponse has
-- succeeded against a server-issued, single-use challenge
-- (lib/security/webauthn.ts storeCredential / updateCredentialCounter, both via
-- the service-role client). Owners keep SELECT and DELETE on their own rows:
-- listing and removing passkeys are legitimate user operations and neither can
-- introduce key material.
--
-- `anon` never has a reason to touch this table (BA-0055: Supabase grants it
-- directly, so REVOKE ... FROM PUBLIC alone would not remove it).
--
-- Idempotent: DROP POLICY IF EXISTS, REVOKE.

DROP POLICY IF EXISTS "Users can insert own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.webauthn_credentials;

REVOKE ALL ON TABLE public.webauthn_credentials FROM anon;
REVOKE ALL ON TABLE public.webauthn_credentials FROM PUBLIC;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.webauthn_credentials FROM authenticated;

-- Verification: neither the grant layer nor the policy layer may allow a
-- client role to create or modify credential rows.
DO $$
DECLARE
  v_grants text;
  v_policies text;
BEGIN
  SELECT string_agg(grantee || ':' || privilege_type, ', ')
  INTO v_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'webauthn_credentials'
    AND (
      grantee IN ('anon', 'PUBLIC')
      OR (grantee = 'authenticated' AND privilege_type IN ('INSERT', 'UPDATE', 'TRUNCATE'))
    );

  IF v_grants IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0059 verification failed: client roles still hold: %', v_grants;
  END IF;

  SELECT string_agg(policyname, ', ')
  INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'webauthn_credentials'
    AND cmd IN ('INSERT', 'UPDATE', 'ALL')
    AND NOT (roles = ARRAY['service_role']::name[]);

  IF v_policies IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0059 verification failed: client write policies remain: %', v_policies;
  END IF;
END
$$;
