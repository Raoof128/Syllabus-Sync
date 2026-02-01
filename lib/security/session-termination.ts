/**
 * Session Termination on Password Change
 *
 * SECURITY: This module provides functionality to terminate all user sessions
 * when a password is changed. This prevents session hijacking after password changes.
 *
 * Implementation:
 * - Session invalidation on password change
 * - Multi-device session management
 * - Session cleanup and revocation
 * - Audit logging for security events
 */

import { createServerClient } from '@/lib/supabase/server';
import { logAuditServer } from '@/lib/security/audit';
import { logger } from '@/lib/logger';


// ============================================================================
// TYPES
// ============================================================================

export interface SessionInfo {
  /** Session ID */
  id: string;
  /** User ID */
  userId: string;
  /** Device information */
  deviceInfo?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Session creation time */
  createdAt: Date;
  /** Last activity time */
  lastActivityAt: Date;
  /** Is this the current session? */
  isCurrent: boolean;
}

export interface SessionTerminationResult {
  /** Number of sessions terminated */
  terminatedCount: number;
  /** Whether the current session was terminated */
  currentSessionTerminated: boolean;
  /** Audit log ID */
  auditLogId?: string | null;
}

// ============================================================================
// SESSION TERMINATION
// ============================================================================

/**
 * Terminate all sessions for a user except the current one
 * This is called when a password is changed
 *
 * @param userId - The user ID
 * @param currentSessionId - The current session ID (to exclude from termination)
 * @returns Promise resolving to termination result
 */
export async function terminateAllOtherSessions(
  userId: string,
  currentSessionId?: string
): Promise<SessionTerminationResult> {
  try {
    const supabase = await createServerClient();

    // Get all sessions for the user
    const { data: sessions, error: fetchError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Failed to fetch sessions:', fetchError);
      throw new Error('Failed to fetch sessions');
    }

    if (!sessions || sessions.length === 0) {
      return {
        terminatedCount: 0,
        currentSessionTerminated: false,
      };
    }

    // Filter out current session
    const sessionsToTerminate = currentSessionId
      ? sessions.filter((session: SessionInfo) => session.id !== currentSessionId)
      : sessions;

    // Terminate sessions
    let terminatedCount = 0;
    for (const session of sessionsToTerminate) {
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', session.id);

      if (!deleteError) {
        terminatedCount++;
      }
    }

    // Log audit event
    const auditLogId = await logAuditServer(userId, {
      action: 'SESSION_TERMINATED',
      severity: 'warning',
      metadata: {
        terminatedCount,
        reason: 'Password changed',
        currentSessionId,
      },
    });

    return {
      terminatedCount,
      currentSessionTerminated: false,
      auditLogId,
    };
  } catch (error) {
    logger.error('Session termination error:', error);
    throw error;
  }
}

/**
 * Terminate a specific session
 *
 * @param userId - The user ID
 * @param sessionId - The session ID to terminate
 * @returns Promise resolving to success status
 */
export async function terminateSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Verify session belongs to user
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !session) {
      logger.error('Session not found or access denied');
      return false;
    }

    // Delete session
    const { error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      logger.error('Failed to terminate session:', deleteError);
      return false;
    }

    // Log audit event
    await logAuditServer(userId, {
      action: 'SESSION_TERMINATED',
      severity: 'info',
      metadata: {
        sessionId,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
      },
    });

    return true;
  } catch (error) {
    logger.error('Session termination error:', error);
    return false;
  }
}

/**
 * Terminate all sessions for a user (including current)
 * This is called for security events like account compromise
 *
 * @param userId - The user ID
 * @returns Promise resolving to termination result
 */
export async function terminateAllSessions(
  userId: string
): Promise<SessionTerminationResult> {
  try {
    const supabase = await createServerClient();

    // Get all sessions for the user
    const { data: sessions, error: fetchError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      logger.error('Failed to fetch sessions:', fetchError);
      throw new Error('Failed to fetch sessions');
    }

    const terminatedCount = sessions?.length || 0;

    // Delete all sessions
    const { error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      logger.error('Failed to terminate sessions:', deleteError);
      throw new Error('Failed to terminate sessions');
    }

    // Log audit event
    const auditLogId = await logAuditServer(userId, {
      action: 'SESSION_TERMINATED',
      severity: 'critical',
      metadata: {
        terminatedCount,
        reason: 'All sessions terminated (security event)',
      },
    });

    return {
      terminatedCount,
      currentSessionTerminated: true,
      auditLogId,
    };
  } catch (error) {
    logger.error('Session termination error:', error);
    throw error;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get all active sessions for a user
 *
 * @param userId - The user ID
 * @returns Promise resolving to array of sessions
 */
export async function getUserSessions(
  userId: string
): Promise<SessionInfo[]> {
  try {
    const supabase = await createServerClient();

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch sessions:', error);
      return [];
    }

    interface DbSession {
      id: string;
      user_id: string;
      device_info?: string;
      ip_address?: string;
      user_agent?: string;
      created_at: string;
      last_activity_at: string;
    }

    return (sessions || []).map((session: DbSession) => ({
      id: session.id,
      userId: session.user_id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      createdAt: new Date(session.created_at),
      lastActivityAt: new Date(session.last_activity_at),
      isCurrent: false, // Would need to compare with current session
    }));
  } catch (error) {
    logger.error('Get sessions error:', error);
    return [];
  }
}

/**
 * Clean up expired sessions
 * This should be called periodically (e.g., via cron job)
 *
 * @param maxAgeDays - Maximum session age in days (default: 30)
 * @returns Promise resolving to number of sessions cleaned up
 */
export async function cleanupExpiredSessions(
  maxAgeDays: number = 30
): Promise<number> {
  try {
    const supabase = await createServerClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const { data, error } = await supabase
      .from('user_sessions')
      .delete()
      .lt('last_activity_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    logger.error('Session cleanup error:', error);
    return 0;
  }
}

// ============================================================================
// PASSWORD CHANGE HOOK
// ============================================================================

/**
 * Handle password change event
 * This should be called after a successful password change
 *
 * @param userId - The user ID
 * @param currentSessionId - The current session ID (optional)
 * @returns Promise resolving to termination result
 */
export async function handlePasswordChange(
  userId: string,
  currentSessionId?: string
): Promise<SessionTerminationResult> {
  try {
    // Terminate all other sessions
    const result = await terminateAllOtherSessions(userId, currentSessionId);

    // Log password change event
    await logAuditServer(userId, {
      action: 'PASSWORD_CHANGE',
      severity: 'warning',
      metadata: {
        sessionsTerminated: result.terminatedCount,
      },
    });

    return result;
  } catch (error) {
    logger.error('Password change handling error:', error);
    throw error;
  }
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * API route handler for terminating sessions
 * Use this in /api/security/sessions/terminate
 */
export async function handleSessionTermination(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { sessionId, terminateAll } = body;

    if (terminateAll) {
      // Terminate all sessions
      const result = await terminateAllSessions(userId);
      return Response.json({
        success: true,
        ...result,
      });
    } else if (sessionId) {
      // Terminate specific session
      const success = await terminateSession(userId, sessionId);
      return Response.json({
        success,
        message: success ? 'Session terminated' : 'Failed to terminate session',
      });
    } else {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'sessionId or terminateAll required' } },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Session termination API error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to terminate session' } },
      { status: 500 }
    );
  }
}

/**
 * API route handler for getting user sessions
 * Use this in /api/security/sessions
 */
export async function handleGetSessions(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const sessions = await getUserSessions(userId);
    return Response.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    logger.error('Get sessions API error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch sessions' } },
      { status: 500 }
    );
  }
}
