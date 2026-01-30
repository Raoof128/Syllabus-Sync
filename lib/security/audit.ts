/**
 * Audit Logging Client Utilities
 *
 * SECURITY: This module provides client-side utilities for audit logging.
 * Note: Primary audit logging happens server-side via database triggers.
 * This module is for logging client-side actions that don't trigger DB operations.
 */

import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'EMAIL_CHANGE'
  | 'MFA_ENABLE'
  | 'MFA_DISABLE'
  | 'MFA_BACKUP_CODE_GENERATED'
  | 'MFA_BACKUP_CODE_USED'
  | 'MFA_BACKUP_CODE_DELETED'
  | 'API_KEY_CREATE'
  | 'API_KEY_REVOKE'
  | 'SETTINGS_CHANGE'
  | 'EXPORT'
  | 'IMPORT'
  | 'SESSION_TERMINATED'
  | 'SECURITY_EVENT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'IP_ANOMALY_DETECTED'
  | 'DEVICE_FINGERPRINT_CHANGED'
  | 'SUSPICIOUS_ACTIVITY';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CLIENT-SIDE AUDIT LOGGING
// ============================================================================

/**
 * Log an audit event from the client side
 * This sends the audit log to the server via API
 *
 * SECURITY: Sensitive data should be sanitized before logging
 *
 * @param entry - The audit log entry
 * @returns Promise resolving to the log ID or null on failure
 */
export async function logAudit(entry: AuditLogEntry): Promise<string | null> {
  try {
    const response = await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: entry.action,
        tableName: entry.tableName,
        recordId: entry.recordId,
        oldData: entry.oldData,
        newData: entry.newData,
        severity: entry.severity || 'info',
        metadata: {
          ...entry.metadata,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to log audit event:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.logId || null;
  } catch (error) {
    console.error('Audit logging error:', error);
    return null;
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'MFA_ENABLE' | 'MFA_DISABLE',
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action,
    severity: action === 'LOGIN' || action === 'LOGOUT' ? 'info' : 'warning',
    metadata: {
      ...metadata,
      category: 'auth',
    },
  });
}

/**
 * Log data export events
 */
export async function logExportEvent(
  dataType: string,
  recordCount: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action: 'EXPORT',
    severity: 'info',
    metadata: {
      ...metadata,
      dataType,
      recordCount,
      category: 'data',
    },
  });
}

/**
 * Log settings changes
 */
export async function logSettingsChange(
  settingName: string,
  oldValue: unknown,
  newValue: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action: 'SETTINGS_CHANGE',
    severity: 'info',
    metadata: {
      ...metadata,
      settingName,
      category: 'settings',
    },
    oldData: { value: sanitizeForAudit(oldValue) },
    newData: { value: sanitizeForAudit(newValue) },
  });
}

// ============================================================================
// DATA SANITIZATION
// ============================================================================

/**
 * Sanitize data for audit logging
 * Removes sensitive fields like passwords, tokens, etc.
 *
 * @param data - The data to sanitize
 * @returns Sanitized data safe for logging
 */
function sanitizeForAudit(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForAudit);
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'creditCard',
    'credit_card',
    'ssn',
    'sin',
    'passport',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForAudit(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// SERVER-SIDE AUDIT LOGGING (for API routes)
// ============================================================================

/**
 * Server-side audit logging helper
 * Use this in API routes for consistent audit logging
 *
 * @param userId - The user ID performing the action
 * @param entry - The audit log entry
 */
export async function logAuditServer(
  userId: string,
  entry: AuditLogEntry
): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase.rpc('log_audit', {
      p_action: entry.action,
      p_table_name: entry.tableName,
      p_record_id: entry.recordId,
      p_old_data: entry.oldData ? JSON.stringify(entry.oldData) : null,
      p_new_data: entry.newData ? JSON.stringify(entry.newData) : null,
      p_severity: entry.severity || 'info',
      p_metadata: entry.metadata ? JSON.stringify(entry.metadata) : '{}',
    });

    if (error) {
      console.error('Server audit logging error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Server audit logging exception:', error);
    return null;
  }
}

// ============================================================================
// AUDIT LOG RETRIEVAL
// ============================================================================

/**
 * Fetch audit logs for the current user
 *
 * @param options - Query options
 * @returns Array of audit log entries
 */
export async function fetchAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<unknown[]> {
  try {
    const params = new URLSearchParams();
    
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.action) params.set('action', options.action);
    if (options.severity) params.set('severity', options.severity);
    if (options.startDate) params.set('startDate', options.startDate.toISOString());
    if (options.endDate) params.set('endDate', options.endDate.toISOString());

    const response = await fetch(`/api/audit/logs?${params.toString()}`);

    if (!response.ok) {
      console.error('Failed to fetch audit logs:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return [];
  }
}

/**
 * Fetch recent security events for the current user
 */
export async function fetchSecurityEvents(limit = 10): Promise<unknown[]> {
  return fetchAuditLogs({
    limit,
    severity: 'warning',
  });
}
