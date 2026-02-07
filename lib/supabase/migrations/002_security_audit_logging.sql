-- Security Audit Logging Migration
-- This migration adds comprehensive audit logging for security events
-- Last Updated: 2026-01-29

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
    'EMAIL_CHANGE', 'MFA_ENABLE', 'MFA_DISABLE', 'MFA_BACKUP_CODE_USED',
    'API_KEY_CREATE', 'API_KEY_REVOKE', 'SETTINGS_CHANGE',
    'EXPORT', 'IMPORT', 'SESSION_TERMINATED',
    'SECURITY_EVENT', 'RATE_LIMIT_EXCEEDED', 'IP_ANOMALY_DETECTED',
    'DEVICE_FINGERPRINT_CHANGED', 'SUSPICIOUS_ACTIVITY'
  )),
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert audit logs (via triggers/functions)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- No one can delete audit logs (immutable)
CREATE POLICY "No one can delete audit logs"
  ON public.audit_logs
  FOR DELETE
  USING (false);

-- ============================================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_severity text DEFAULT 'info',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    severity,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_severity,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit TO authenticated;

-- ============================================================================
-- AUTOMATIC AUDIT TRIGGERS
-- ============================================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_action text;
  v_old_data jsonb;
  v_new_data jsonb;
  v_severity text;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  -- Skip if no user (e.g., system operations)
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine action and data based on operation
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
    v_severity := 'info';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_new_data := to_jsonb(NEW);
    v_old_data := to_jsonb(OLD);
    v_severity := 'info';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_new_data := NULL;
    v_old_data := to_jsonb(OLD);
    v_severity := 'warning';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Log the audit event
  PERFORM public.log_audit(
    p_user_id => v_user_id,
    p_action => v_action,
    p_table_name => TG_TABLE_NAME,
    p_record_id => COALESCE(NEW.id, OLD.id),
    p_old_data => v_old_data,
    p_new_data => v_new_data,
    p_severity => v_severity
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- APPLY AUDIT TRIGGERS TO TABLES
-- ============================================================================

-- Units table
DROP TRIGGER IF EXISTS audit_units ON public.units;
CREATE TRIGGER audit_units
  AFTER INSERT OR UPDATE OR DELETE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- Deadlines table
DROP TRIGGER IF EXISTS audit_deadlines ON public.deadlines;
CREATE TRIGGER audit_deadlines
  AFTER INSERT OR UPDATE OR DELETE ON public.deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- Events table
DROP TRIGGER IF EXISTS audit_events ON public.events;
CREATE TRIGGER audit_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- Notifications table
DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- User preferences table
DROP TRIGGER IF EXISTS audit_user_preferences ON public.user_preferences;
CREATE TRIGGER audit_user_preferences
  AFTER INSERT OR UPDATE OR DELETE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- AUDIT LOG RETENTION POLICY
-- ============================================================================

-- Function to clean up old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO service_role;

-- ============================================================================
-- AUDIT LOG QUERY FUNCTIONS
-- ============================================================================

-- Get audit logs for current user
CREATE OR REPLACE FUNCTION public.get_my_audit_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_action text DEFAULT NULL,
  p_severity text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  severity text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.record_id,
    al.old_data,
    al.new_data,
    al.severity,
    al.ip_address,
    al.user_agent,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  WHERE al.user_id = auth.uid()
    AND (p_action IS NULL OR al.action = p_action)
    AND (p_severity IS NULL OR al.severity = p_severity)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_audit_logs TO authenticated;

-- Get security events for current user
CREATE OR REPLACE FUNCTION public.get_my_security_events(
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  action text,
  severity text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.severity,
    al.ip_address,
    al.user_agent,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  WHERE al.user_id = auth.uid()
    AND al.severity IN ('warning', 'critical')
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_security_events TO authenticated;

-- ============================================================================
-- AUDIT LOG STATISTICS
-- ============================================================================

-- Get audit log statistics for current user
CREATE OR REPLACE FUNCTION public.get_my_audit_stats()
RETURNS TABLE (
  total_logs bigint,
  critical_count bigint,
  warning_count bigint,
  info_count bigint,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_logs,
    COUNT(*) FILTER (WHERE severity = 'critical')::bigint as critical_count,
    COUNT(*) FILTER (WHERE severity = 'warning')::bigint as warning_count,
    COUNT(*) FILTER (WHERE severity = 'info')::bigint as info_count,
    MAX(created_at) as last_activity
  FROM public.audit_logs
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_audit_stats TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Security audit log table - tracks all user actions for compliance and security monitoring';
COMMENT ON FUNCTION public.log_audit IS 'Log an audit event - called by triggers and application code';
COMMENT ON FUNCTION public.get_my_audit_logs IS 'Get audit logs for the current user with optional filters';
COMMENT ON FUNCTION public.get_my_security_events IS 'Get security events (warning/critical) for the current user';
COMMENT ON FUNCTION public.get_my_audit_stats IS 'Get audit log statistics for the current user';
COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Clean up audit logs older than 90 days - should be run periodically';
