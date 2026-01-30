/**
 * 2FA Backup Codes Management
 *
 * SECURITY: This module provides 2FA backup code generation and validation.
 * Backup codes allow users to access their account if they lose their 2FA device.
 *
 * Implementation:
 * - Secure code generation
 * - Code validation and consumption
 * - Code storage and management
 * - Audit logging
 */

import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { logAuditServer } from '@/lib/security/audit';

// ============================================================================
// CONSTANTS
// ============================================================================

const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No ambiguous characters

// ============================================================================
// TYPES
// ============================================================================

export interface BackupCode {
  /** Unique code ID */
  id: string;
  /** The backup code (hashed) */
  code: string;
  /** User ID */
  userId: string;
  /** Has this code been used? */
  used: boolean;
  /** When was this code used? */
  usedAt?: Date;
  /** Creation timestamp */
  createdAt: Date;
}

export interface BackupCodeGenerationResult {
  /** Generated backup codes (plaintext, for display only) */
  codes: string[];
  /** Number of codes generated */
  count: number;
  /** Timestamp */
  generatedAt: Date;
}

export interface BackupCodeValidationResult {
  /** Is the code valid? */
  valid: boolean;
  /** Was the code already used? */
  alreadyUsed: boolean;
  /** Code ID (if valid) */
  codeId?: string;
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate a single backup code
 *
 * @returns The generated code
 */
function generateBackupCode(): string {
  let code = '';
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, BACKUP_CODE_ALPHABET.length);
    code += BACKUP_CODE_ALPHABET[randomIndex];
  }
  return code;
}

/**
 * Generate multiple backup codes for a user
 *
 * @param userId - The user ID
 * @returns Promise resolving to generation result
 */
export async function generateBackupCodes(
  userId: string
): Promise<BackupCodeGenerationResult> {
  try {
    const supabase = await createServerClient();

    // Generate codes
    const codes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      codes.push(generateBackupCode());
    }

    // Store codes in database (hashed)
    const storedCodes: BackupCode[] = [];
    for (const code of codes) {
      const hashedCode = hashBackupCode(code);
      const { data, error } = await supabase
        .from('backup_codes')
        .insert({
          user_id: userId,
          code: hashedCode,
          used: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store backup code:', error);
        throw new Error('Failed to generate backup codes');
      }

      storedCodes.push(data as BackupCode);
    }

    // Log audit event
    await logAuditServer(userId, {
      action: 'MFA_BACKUP_CODE_GENERATED',
      severity: 'info',
      metadata: {
        codeCount: codes.length,
      },
    });

    return {
      codes,
      count: codes.length,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Backup code generation error:', error);
    throw error;
  }
}

/**
 * Hash a backup code for storage
 *
 * @param code - The plaintext code
 * @returns Hashed code
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// ============================================================================
// CODE VALIDATION
// ============================================================================

/**
 * Validate a backup code
 *
 * @param userId - The user ID
 * @param code - The backup code to validate
 * @returns Promise resolving to validation result
 */
export async function validateBackupCode(
  userId: string,
  code: string
): Promise<BackupCodeValidationResult> {
  try {
    const supabase = await createServerClient();

    // Hash the code
    const hashedCode = hashBackupCode(code);

    // Find matching code
    const { data: backupCode, error } = await supabase
      .from('backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', hashedCode)
      .single();

    if (error || !backupCode) {
      return {
        valid: false,
        alreadyUsed: false,
      };
    }

    // Check if already used
    if (backupCode.used) {
      return {
        valid: false,
        alreadyUsed: true,
      };
    }

    return {
      valid: true,
      alreadyUsed: false,
      codeId: backupCode.id,
    };
  } catch (error) {
    console.error('Backup code validation error:', error);
    return {
      valid: false,
      alreadyUsed: false,
    };
  }
}

/**
 * Consume a backup code (mark as used)
 *
 * @param userId - The user ID
 * @param codeId - The code ID to consume
 * @returns Promise resolving to success status
 */
export async function consumeBackupCode(
  userId: string,
  codeId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Mark code as used
    const { error } = await supabase
      .from('backup_codes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeId)
      .eq('user_id', userId)
      .eq('used', false);

    if (error) {
      console.error('Failed to consume backup code:', error);
      return false;
    }

    // Log audit event
    await logAuditServer(userId, {
      action: 'MFA_BACKUP_CODE_USED',
      severity: 'warning',
      metadata: {
        codeId,
      },
    });

    return true;
  } catch (error) {
    console.error('Backup code consumption error:', error);
    return false;
  }
}

// ============================================================================
// CODE MANAGEMENT
// ============================================================================

/**
 * Get remaining backup codes for a user
 *
 * @param userId - The user ID
 * @returns Promise resolving to array of backup codes
 */
export async function getBackupCodes(
  userId: string
): Promise<BackupCode[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch backup codes:', error);
      return [];
    }

    interface DbBackupCode {
      id: string;
      code: string;
      user_id: string;
      used: boolean;
      used_at?: string;
      created_at: string;
    }

    return (data || []).map((code: DbBackupCode) => ({
      id: code.id,
      code: code.code,
      userId: code.user_id,
      used: code.used,
      usedAt: code.used_at ? new Date(code.used_at) : undefined,
      createdAt: new Date(code.created_at),
    }));
  } catch (error) {
    console.error('Get backup codes error:', error);
    return [];
  }
}

/**
 * Get backup code count for a user
 *
 * @param userId - The user ID
 * @returns Promise resolving to count of remaining codes
 */
export async function getBackupCodeCount(userId: string): Promise<number> {
  try {
    const supabase = await createServerClient();

    const { count, error } = await supabase
      .from('backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('used', false);

    if (error) {
      console.error('Failed to count backup codes:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Count backup codes error:', error);
    return 0;
  }
}

/**
 * Regenerate backup codes for a user
 * This invalidates all existing codes and generates new ones
 *
 * @param userId - The user ID
 * @returns Promise resolving to generation result
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<BackupCodeGenerationResult> {
  try {
    const supabase = await createServerClient();

    // Delete all existing codes
    const { error: deleteError } = await supabase
      .from('backup_codes')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete old backup codes:', deleteError);
      throw new Error('Failed to regenerate backup codes');
    }

    // Generate new codes
    return await generateBackupCodes(userId);
  } catch (error) {
    console.error('Backup code regeneration error:', error);
    throw error;
  }
}

/**
 * Delete all backup codes for a user
 *
 * @param userId - The user ID
 * @returns Promise resolving to success status
 */
export async function deleteBackupCodes(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('backup_codes')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete backup codes:', error);
      return false;
    }

    // Log audit event
    await logAuditServer(userId, {
      action: 'MFA_BACKUP_CODE_DELETED',
      severity: 'warning',
      metadata: {},
    });

    return true;
  } catch (error) {
    console.error('Delete backup codes error:', error);
    return false;
  }
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * API route handler for generating backup codes
 * Use this in /api/security/backup-codes/generate
 */
export async function handleGenerateBackupCodes(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const result = await generateBackupCodes(userId);

    return Response.json({
      success: true,
      codes: result.codes,
      count: result.count,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate backup codes' } },
      { status: 500 }
    );
  }
}

/**
 * API route handler for validating backup codes
 * Use this in /api/security/backup-codes/validate
 */
export async function handleValidateBackupCode(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return Response.json(
        { error: { code: 'MISSING_CODE', message: 'Backup code is required' } },
        { status: 400 }
      );
    }

    const result = await validateBackupCode(userId, code);

    if (!result.valid) {
      return Response.json({
        success: false,
        alreadyUsed: result.alreadyUsed,
        message: result.alreadyUsed
          ? 'This backup code has already been used'
          : 'Invalid backup code',
      });
    }

    // Consume the code
    if (result.codeId) {
      await consumeBackupCode(userId, result.codeId);
    }

    return Response.json({
      success: true,
      message: 'Backup code validated successfully',
    });
  } catch (error) {
    console.error('Validate backup code error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to validate backup code' } },
      { status: 500 }
    );
  }
}

/**
 * API route handler for getting backup codes
 * Use this in /api/security/backup-codes
 */
export async function handleGetBackupCodes(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const codes = await getBackupCodes(userId);
    const count = await getBackupCodeCount(userId);

    return Response.json({
      codes: codes.map((c) => ({
        id: c.id,
        used: c.used,
        createdAt: c.createdAt,
      })),
      count,
      remaining: count,
    });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch backup codes' } },
      { status: 500 }
    );
  }
}

/**
 * API route handler for regenerating backup codes
 * Use this in /api/security/backup-codes/regenerate
 */
export async function handleRegenerateBackupCodes(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const result = await regenerateBackupCodes(userId);

    return Response.json({
      success: true,
      codes: result.codes,
      count: result.count,
      generatedAt: result.generatedAt,
      message: 'Backup codes regenerated successfully',
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to regenerate backup codes' } },
      { status: 500 }
    );
  }
}
