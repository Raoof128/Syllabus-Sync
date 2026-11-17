-- ============================================================================
-- SECURITY: Audit Logging System
-- ============================================================================
-- This migration adds comprehensive audit logging for sensitive database operations.
-- All security-relevant actions are tracked for compliance and incident response.
--
-- Tables covered:
-- - auth.users (logins, password changes)
-- - profiles (profile updates)
-- - units (CRUD operations)
-- - deadlines (CRUD operations)
-- - events (CRUD operations)
-- - user_preferences (settings changes)
--
-- Retention: 90 days (configurable via audit_log_retention_days setting)
-- ============================================================================

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Who performed the action
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text,
    
    -- What was done
    action text NOT NULL CHECK (action IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE',
        'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
        'EMAIL_CHANGE', 'MFA_ENABLE', 'MFA_DISABLE',
        'API_KEY_CREATE', 'API_KEY_REVOKE',
        'SETTINGS_CHANGE', 'EXPORT', 'IMPORT'
    )),
    
    -- Where it happened
    table_name text,
    record_id uuid,
    
    -- Request context
    ip_address inet,
    user_agent text,
    request_id text,
    
    -- Change details (stored as JSONB for flexibility)
    old_data jsonb,
    new_data jsonb,
    
    -- Additional metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Classification
    severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- Index for recent logs (faster queries).
--
-- BA-0053: this was a partial index with `WHERE created_at > now() - interval
-- '7 days'`. now() is STABLE, not IMMUTABLE, and PostgreSQL rejects
-- non-IMMUTABLE functions in an index predicate -- so the statement failed on
-- every PostgreSQL version and aborted this entire migration at line 70 of 340.
-- Everything below it (audit_settings, log_audit, cleanup_old_audit_logs,
-- audit_trigger, the four audit_logs policies including the append-only pair,
-- and the recent_audit_activity / security_audit_events views) therefore never
-- ran. Confirmed absent from production and from a clean replay of all
-- migrations alike.
--
-- A time-relative predicate cannot be expressed as a partial index at all; the
-- planner already serves "recent rows" efficiently from the plain DESC index
-- below, so the predicate is dropped rather than reformulated.
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(created_at DESC);

-- ============================================================================
-- AUDIT LOG RETENTION CONFIGURATION
-- ============================================================================

-- Create a settings table for audit configuration
CREATE TABLE IF NOT EXISTS public.audit_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);

-- BA-0057 (P1): audit_settings was the only table in the entire schema that was
-- never given RLS -- no policies, no grants, no revokes. While this migration
-- was unappliable that was harmless, because the table did not exist anywhere.
-- Repairing the migration would have CREATED the exposure, which is exactly
-- what a fresh build demonstrated: as `anon`, `SELECT` returned a real row and
-- `UPDATE public.audit_settings SET value = '0'` reported `UPDATE 1`.
--
-- The table governs audit-log retention, so an anonymous caller could set the
-- window to zero or negative. cleanup_old_audit_logs() reads that window and is
-- SECURITY DEFINER; it is not currently client-executable (verified against the
-- catalog), so the full "wipe the audit trail" chain does not close today --
-- but a config table that anyone can rewrite is a control failure regardless,
-- and the only thing standing between it and that chain is one GRANT.
--
-- Locked to service_role, matching app_config (20260214003000).
ALTER TABLE public.audit_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.audit_settings FROM PUBLIC;
-- Supabase grants tables to anon/authenticated directly, so revoking from
-- PUBLIC alone leaves those grants in place (BA-0055). Both are named.
REVOKE ALL ON TABLE public.audit_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.audit_settings TO service_role;

DROP POLICY IF EXISTS "Service role can manage audit settings" ON public.audit_settings;
CREATE POLICY "Service role can manage audit settings"
    ON public.audit_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert default retention period (90 days)
INSERT INTO public.audit_settings (key, value, description)
VALUES (
    'audit_log_retention_days',
    '90',
    'Number of days to retain audit logs before automatic deletion'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- AUDIT LOG FUNCTIONS
-- ============================================================================

-- Function to insert audit log entry
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action text,
    p_table_name text DEFAULT NULL,
    p_record_id uuid DEFAULT NULL,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL,
    p_severity text DEFAULT 'info',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id uuid;
    v_user_id uuid;
    v_user_email text;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    -- Get user email if available
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_user_email
        FROM auth.users
        WHERE id = v_user_id;
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        severity,
        metadata
    ) VALUES (
        v_user_id,
        v_user_email,
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_severity,
        p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Function to clean up old audit logs (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_retention_days integer;
    v_deleted_count integer;
BEGIN
    -- Get retention period from settings
    SELECT value::integer INTO v_retention_days
    FROM public.audit_settings
    WHERE key = 'audit_log_retention_days';
    
    -- Default to 90 days if not set
    v_retention_days := COALESCE(v_retention_days, 90);
    
    -- Delete old logs
    DELETE FROM public.audit_logs
    WHERE created_at < now() - (v_retention_days || ' days')::interval;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    PERFORM public.log_audit(
        'DELETE',
        'audit_logs',
        NULL,
        NULL,
        jsonb_build_object('deleted_count', v_deleted_count, 'retention_days', v_retention_days),
        'info',
        jsonb_build_object('operation', 'cleanup_old_audit_logs')
    );
    
    RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

-- Trigger function for tracking changes
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
BEGIN
    -- Determine action type
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
    
    -- Log the change
    PERFORM public.log_audit(
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_data,
        v_new_data,
        'info'
    );
    
    -- Return appropriate row
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Apply audit triggers to sensitive tables
-- Note: Enable these as needed based on compliance requirements

-- Units table audit
CREATE TRIGGER audit_units_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Deadlines table audit
CREATE TRIGGER audit_deadlines_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.deadlines
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Events table audit (only user-created events)
--
-- BA-0053: this was a single trigger covering INSERT OR UPDATE OR DELETE with
-- `WHEN (NEW.user_id IS NOT NULL OR OLD.user_id IS NOT NULL)`. PostgreSQL
-- rejects that outright -- "DELETE trigger's WHEN condition cannot reference NEW
-- values" -- because NEW does not exist for DELETE (nor OLD for INSERT). This
-- was the SECOND independent fatal error in this migration, after the
-- non-IMMUTABLE index predicate at line 70; together they are conclusive that
-- the file was never executed against a database before being committed.
--
-- Split so each trigger references only the row-variable that exists for its
-- events, preserving the original intent exactly.
DROP TRIGGER IF EXISTS audit_events_trigger ON public.events;
CREATE TRIGGER audit_events_trigger
    AFTER INSERT OR UPDATE ON public.events
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_events_delete_trigger ON public.events;
CREATE TRIGGER audit_events_delete_trigger
    AFTER DELETE ON public.events
    FOR EACH ROW
    WHEN (OLD.user_id IS NOT NULL)
    EXECUTE FUNCTION public.audit_trigger();

-- Profiles table audit
CREATE TRIGGER audit_profiles_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- User preferences audit
CREATE TRIGGER audit_user_preferences_trigger
    AFTER UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================================================
-- ROW LEVEL SECURITY FOR AUDIT LOGS
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Only service role can insert audit logs (via functions)
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (false); -- Only via SECURITY DEFINER functions

-- No direct updates or deletes allowed
CREATE POLICY "No updates to audit logs"
    ON public.audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "No deletes to audit logs"
    ON public.audit_logs FOR DELETE
    USING (false);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.audit_logs TO authenticated;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Recent activity view (last 24 hours)
CREATE OR REPLACE VIEW public.recent_audit_activity AS
SELECT
    al.*,
    CASE
        WHEN al.action IN ('LOGIN', 'LOGOUT') THEN 'auth'
        WHEN al.action IN ('PASSWORD_CHANGE', 'PASSWORD_RESET', 'EMAIL_CHANGE') THEN 'security'
        WHEN al.action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'data'
        ELSE 'other'
    END AS category
FROM public.audit_logs al
WHERE al.created_at > now() - interval '24 hours'
ORDER BY al.created_at DESC;

GRANT SELECT ON public.recent_audit_activity TO authenticated;

-- Security events view (critical actions)
CREATE OR REPLACE VIEW public.security_audit_events AS
SELECT *
FROM public.audit_logs
WHERE severity IN ('warning', 'critical')
   OR action IN ('PASSWORD_CHANGE', 'EMAIL_CHANGE', 'MFA_ENABLE', 'MFA_DISABLE', 'LOGIN', 'LOGOUT')
ORDER BY created_at DESC;

GRANT SELECT ON public.security_audit_events TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Security audit log for tracking all sensitive operations';
COMMENT ON FUNCTION public.log_audit IS 'Insert a new audit log entry';
COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Remove audit logs older than retention period';
