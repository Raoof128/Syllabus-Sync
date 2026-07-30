-- BA-0051 (P1): repair the two functions that BA-0050 broke.
--
-- BA-0050 dropped `profiles.student_id`. Dropping it required recreating
-- `public.user_details`, which selected the column, so the view went from 15
-- columns to 14. Two functions kept referring to the column and both now fail:
--
--   get_my_profile()
--     Declares RETURNS TABLE(..., student_id text, ...) — 15 columns — and its
--     body is `RETURN QUERY SELECT * FROM public.user_details`. PL/pgSQL checks
--     each returned row against the declared result type, so this raises
--     42804 "structure of query does not match function result type" for any
--     caller that matches a row.
--
--   create_user_profile(p_user_id, p_email, p_full_name, p_student_id)
--     Body inserts into (id, email, full_name, student_id) and so raises
--     42703 undefined_column at plan time.
--
-- Both confirmed against production 2026-07-30 by setting request.jwt.claims to a
-- real user inside a transaction that was rolled back.
--
-- WHY BA-0050'S VERIFICATION MISSED THIS. It checked that the column was gone
-- from the table and the view, that security_invoker survived, and that a live
-- signup returned 200. All three passed. It never asked the catalog which other
-- objects named the column. Signup passed because it uses ensure_user_profile,
-- which never referenced student_id, and get_my_profile has no caller in the
-- application, so nothing failed loudly. Dropping a column is a contract change
-- for every dependent object, and only the catalog knows the full list. Same
-- lesson as BA-0048: sweep, do not enumerate.
--
-- The catalog sweep behind this migration found exactly these two functions and
-- no view, trigger, index or constraint.
--
-- Idempotent: DROP ... IF EXISTS followed by CREATE.

-- ---------------------------------------------------------------------------
-- get_my_profile()
--
-- The result type changes, so CREATE OR REPLACE cannot be used; the function has
-- to be dropped and recreated. Two deliberate changes beyond removing the column:
--
--   * The body now lists columns explicitly instead of `SELECT *`. `SELECT *`
--     into a declared TABLE type is exactly what broke here: the view changed
--     shape and the function silently kept its old contract. An explicit list
--     fails loudly at migration time instead.
--   * Client reach is narrowed to `authenticated`. The old ACL granted EXECUTE to
--     PUBLIC and to `anon` on a SECURITY DEFINER function. It filters on
--     auth.uid() so an anon caller only ever got zero rows, but a definer
--     function reachable by PUBLIC is the trap BA-0049 was about, and nothing
--     without a session has any reason to call this.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_my_profile();

CREATE FUNCTION public.get_my_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  faculty text,
  course text,
  year text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  xp integer,
  streak_days integer,
  longest_streak integer,
  last_activity_date date,
  level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ud.id, ud.email, ud.full_name, ud.faculty, ud.course, ud.year,
         ud.avatar_url, ud.created_at, ud.updated_at, ud.xp, ud.streak_days,
         ud.longest_streak, ud.last_activity_date, ud.level
  FROM public.user_details ud
  WHERE ud.id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- create_user_profile()
--
-- The p_student_id parameter is removed rather than kept and ignored: silently
-- discarding a supplied student ID would let a caller believe it had been stored.
-- Removing it makes any remaining caller fail loudly on the signature instead.
--
-- The ownership check is preserved verbatim. Note for a later decision, not acted
-- on here: this function duplicates `ensure_user_profile`, which has a stricter
-- fail-closed guard and is the path the application actually uses. Nothing in the
-- codebase calls create_user_profile. It is a candidate for removal, but deleting
-- a capability is a separate decision from repairing a break.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text);

CREATE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Validate that the caller is creating their own profile.
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name);

  v_result := jsonb_build_object(
    'success', true,
    'profile_id', p_user_id,
    'message', 'Profile created successfully'
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_profile(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_user_profile(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) TO authenticated, service_role;

-- ============================================================================
-- Verification. Catalog-driven, and it includes the execution check that BA-0050
-- should have run.
-- ============================================================================

DO $$
DECLARE
  v_offending text;
  v_declared int;
  v_actual int;
  v_uid uuid;
  v_rows int;
BEGIN
  -- 1. No function in `public` may still name the dropped column.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (
      pg_get_functiondef(p.oid) ILIKE '%student\_id%'
      OR pg_get_function_result(p.oid) ILIKE '%student\_id%'
      OR pg_get_function_identity_arguments(p.oid) ILIKE '%student\_id%'
    );

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0051 verification failed: functions still reference student_id: %', v_offending;
  END IF;

  -- 2. Nor may any view, index or constraint.
  SELECT string_agg(DISTINCT c.relname, ', ')
  INTO v_offending
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
    AND pg_get_viewdef(c.oid) ILIKE '%student\_id%';

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0051 verification failed: views still reference student_id: %', v_offending;
  END IF;

  -- 3. get_my_profile's declared result must match user_details column-for-column.
  --    This is the specific mismatch that broke, so it is asserted numerically
  --    rather than inferred from the DDL above having run.
  --    Counted from the OUT/TABLE argument modes, which is what "declared result
  --    columns" means, and which stays correct if the function ever gains an IN
  --    parameter. COALESCE guards the case where proargmodes is NULL.
  SELECT count(*) INTO v_declared
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL unnest(coalesce(p.proargmodes, ARRAY[]::"char"[])) AS m
  WHERE n.nspname = 'public' AND p.proname = 'get_my_profile'
    AND m IN ('t', 'o');

  SELECT count(*) INTO v_actual
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_details';

  IF v_declared <> v_actual THEN
    RAISE EXCEPTION 'BA-0051 verification failed: get_my_profile declares % columns, user_details has %',
      v_declared, v_actual;
  END IF;

  -- 4. Execute it as a real user. A structural mismatch only raises once a row is
  --    actually returned, so a service_role call (auth.uid() IS NULL, zero rows)
  --    passes even when the function is broken. That is precisely how this defect
  --    survived BA-0050's checks.
  SELECT id INTO v_uid FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'BA-0051: no users present, skipping the execution check';
  ELSE
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    SELECT count(*) INTO v_rows FROM public.get_my_profile();
    PERFORM set_config('request.jwt.claims', NULL, true);

    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'BA-0051 verification failed: get_my_profile returned % rows for a real user, expected 1', v_rows;
    END IF;
    RAISE NOTICE 'BA-0051: get_my_profile executes cleanly for a real session and returns its own row';
  END IF;

  -- 5. Neither function may be executable by anon or PUBLIC.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
  LEFT JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_my_profile', 'create_user_profile')
    AND acl.privilege_type = 'EXECUTE'
    AND (acl.grantee = 0 OR r.rolname = 'anon');

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0051 verification failed: still client-executable by anon/PUBLIC: %', v_offending;
  END IF;

  -- 6. And authenticated must keep EXECUTE, or the repair has locked out the
  --    callers it exists for.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
    JOIN pg_roles r ON r.oid = acl.grantee
    WHERE n.nspname = 'public' AND p.proname = 'get_my_profile'
      AND acl.privilege_type = 'EXECUTE' AND r.rolname = 'authenticated'
  ) THEN
    RAISE EXCEPTION 'BA-0051 verification failed: authenticated lost EXECUTE on get_my_profile';
  END IF;
END
$$;
