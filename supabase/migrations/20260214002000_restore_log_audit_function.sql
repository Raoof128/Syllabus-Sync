-- ============================================================================
-- RESTORE / STANDARDIZE log_audit RPC
-- ----------------------------------------------------------------------------
-- Ensures public.log_audit exists in the canonical migration chain and matches
-- how application code calls it (both minimal and extended parameter shapes).
-- ============================================================================

BEGIN;

-- BA-0053: 20260129000000 declares a 7-argument log_audit whose parameters are a
-- strict prefix of the 10-argument one below, with identical defaults. While
-- that migration was unappliable the overload never existed, so the ambiguity
-- was invisible. Repairing that migration made both signatures real, and every
-- existing call site passes 6 or 7 arguments -- which then matches BOTH and
-- fails with "function public.log_audit(...) is not unique".
--
-- That is not cosmetic: handle_new_user_safe() calls log_audit, so the
-- ambiguity breaks profile creation for every new signup. Caught by building a
-- database from the repaired migrations and creating a user, which surfaced
-- `WARNING: handle_new_user_safe failed for user ...: function
-- public.log_audit(text, name, uuid, jsonb, jsonb, unknown) is not unique`.
--
-- The 7-argument form carries no capability this one lacks, so it is dropped
-- rather than kept and disambiguated at each call site.
DROP FUNCTION IF EXISTS public.log_audit(text, text, uuid, jsonb, jsonb, text, jsonb);

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_severity text DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_actor_id uuid;
  v_target_user_id uuid;
  v_user_email text;
  v_ip inet;
BEGIN
  v_actor_id := auth.uid();
  v_target_user_id := COALESCE(p_user_id, v_actor_id);

  -- Authenticated users may only write logs for themselves.
  IF auth.role() = 'authenticated'
     AND v_actor_id IS NOT NULL
     AND v_target_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'Unauthorized audit log write attempt'
      USING ERRCODE = '42501';
  END IF;

  -- Validate severity input defensively.
  IF p_severity NOT IN ('info', 'warning', 'critical') THEN
    p_severity := 'info';
  END IF;

  -- Best-effort inet cast: invalid IPs become NULL.
  BEGIN
    IF p_ip_address IS NOT NULL AND length(trim(p_ip_address)) > 0 THEN
      v_ip := p_ip_address::inet;
    ELSE
      v_ip := NULL;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_ip := NULL;
  END;

  IF v_target_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_target_user_id;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    ip_address,
    user_agent,
    old_data,
    new_data,
    metadata,
    severity
  ) VALUES (
    v_target_user_id,
    v_user_email,
    p_action,
    p_table_name,
    p_record_id,
    v_ip,
    p_user_agent,
    p_old_data,
    p_new_data,
    COALESCE(p_metadata, '{}'::jsonb),
    p_severity
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit(
  text,
  text,
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb,
  uuid,
  text,
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit(
  text,
  text,
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb,
  uuid,
  text,
  text
) TO service_role;

COMMIT;
