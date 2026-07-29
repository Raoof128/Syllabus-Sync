-- ============================================================================
-- HARDENING FIX (Lane D audit, P3-16 + P3-17)
-- ----------------------------------------------------------------------------
-- Several SECURITY DEFINER functions still live today have no SET search_path
-- at all, unlike the hardened pattern used elsewhere in this codebase
-- (SET search_path = public / SET search_path = ''). Bodies are schema-
-- qualified where it matters, limiting practical blast radius, but this is a
-- real defense-in-depth gap. Logic is preserved byte-for-byte; only
-- `SET search_path = public` is added to each.
--
-- Also: cleanup_old_audit_logs() has no REVOKE ... FROM PUBLIC, unlike its
-- siblings purge_deleted_records()/refresh_analytics_views() from the same
-- era, which both explicitly restrict to service_role. Add the same
-- restriction here for consistency and defense in depth.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing email directly (must use the authentication flow)
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email directly. Use the authentication flow.';
  END IF;

  -- Auto-update the updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_deadline_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_early boolean;
    v_is_first boolean;
BEGIN
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        -- Update streak
        PERFORM update_streak(NEW.user_id);

        -- Check if first deadline
        SELECT NOT EXISTS (
            SELECT 1 FROM public.deadlines
            WHERE user_id = NEW.user_id AND completed = true AND id != NEW.id
        ) INTO v_is_first;

        IF v_is_first THEN
            PERFORM award_xp(NEW.user_id, 'first_deadline', NEW.id,
                             jsonb_build_object('title', NEW.title));
        END IF;

        -- Award base XP
        PERFORM award_xp(NEW.user_id, 'deadline_completed', NEW.id,
                         jsonb_build_object('title', NEW.title, 'unit_code', NEW.unit_code));

        -- Check if early (24h+ before due)
        IF NEW.due_date > NOW() + INTERVAL '24 hours' THEN
            PERFORM award_xp(NEW.user_id, 'deadline_early', NEW.id,
                             jsonb_build_object('hours_early',
                               EXTRACT(EPOCH FROM (NEW.due_date - NOW())) / 3600));
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_unit_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update streak
  PERFORM update_streak(NEW.user_id);

  -- Award XP for adding a unit
  PERFORM award_xp(NEW.user_id, 'unit_added', NEW.id,
                   jsonb_build_object('code', NEW.code, 'name', NEW.name));

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_webauthn_challenges') THEN
    CREATE OR REPLACE FUNCTION public.cleanup_expired_webauthn_challenges()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    BEGIN
      DELETE FROM public.webauthn_challenges
      WHERE expires_at < now();
    END;
    $fn$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger') THEN
    CREATE OR REPLACE FUNCTION public.audit_trigger()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    DECLARE
        v_old_data jsonb;
        v_new_data jsonb;
        v_action text;
    BEGIN
        IF TG_OP = 'INSERT' THEN
            v_action := 'CREATE';
            v_new_data := to_jsonb(NEW);
        ELSIF TG_OP = 'UPDATE' THEN
            v_action := 'UPDATE';
            v_old_data := to_jsonb(OLD);
            v_new_data := to_jsonb(NEW);
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'DELETE';
            v_old_data := to_jsonb(OLD);
        END IF;

        PERFORM public.log_audit(
            v_action,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            v_old_data,
            v_new_data,
            'info'
        );

        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
    $fn$;
  END IF;
END $$;

-- P3-17: restrict cleanup_old_audit_logs to service_role, matching the
-- pattern already used by purge_deleted_records/refresh_analytics_views.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_audit_logs') THEN
    REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;
  END IF;
END $$;
