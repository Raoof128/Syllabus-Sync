/**
 * Security Module Index
 *
 * This file exports all security-related modules for easy importing.
 * It provides a centralized location for all security utilities.
 */

// ============================================================================
// SRI (Subresource Integrity)
// ============================================================================

export {
  EXTERNAL_RESOURCES,
  generateSRIHash,
  generateSRIHashFromURL,
  generateSRIHashFromFile,
  generateSRIScript,
  generateSRIStyle,
  isValidSRIHash,
  validateSREResources,
  getSRIScriptProps,
  generateSRIScriptsForDocument,
  generateSRIStylesForDocument,
  generateSRIUpdateScript,
} from "./sri-enhanced";

export type {
  SRIResource,
  SRIScriptOptions,
  SRIStyleOptions,
} from "./sri-enhanced";

// ============================================================================
// CSP (Content Security Policy)
// ============================================================================

export {
  THEME_SCRIPT,
  RTL_SCRIPT,
  CSP_SCRIPT_HASHES,
  buildCSP,
  buildDevCSP,
  buildProdCSP,
  buildReportOnlyCSP,
  getCSP,
  applyCSPHeaders,
  applyCSPReportOnlyHeaders,
  getCSPViolationSeverity,
  sanitizeCSPReport,
} from "./csp-enhanced";

export type {
  CSPOptions,
  CSPViolationReport,
  CSPSeverity,
} from "./csp-enhanced";

// Nonce-based CSP (used by root middleware.ts)
export { generateNonce, buildNonceCSP } from "./csp";

// ============================================================================
// Audit Logging
// ============================================================================

export {
  logAudit,
  logAuthEvent,
  logExportEvent,
  logSettingsChange,
  logAuditServer,
  fetchAuditLogs,
  fetchSecurityEvents,
} from "./audit";

export type { AuditAction, AuditSeverity, AuditLogEntry } from "./audit";

// ============================================================================
// CSRF Protection
// ============================================================================

export {
  generateCSRFToken,
  validateCSRFToken,
  validateOrigin,
  withCSRFProtection,
  setCSRFCookie,
  shouldSkipCSRF,
  validateCSRF,
} from "./csrf";

// ============================================================================
// IP Security
// ============================================================================

export {
  isValidIP,
  getClientIP,
  getRateLimitIdentifier,
  isTrustedOrigin,
} from "./ip";

// ============================================================================
// Request Signing
// ============================================================================

export {
  generateSignature,
  generateSigningHeaders,
  verifySignature,
  withSignatureVerification,
  signFetchRequest,
  isNonceUsed,
  clearExpiredNonces,
} from "./request-signing";

export type {
  SignedRequestOptions,
  SignatureVerificationResult,
} from "./request-signing";

// ============================================================================
// Password Breach Checking
// ============================================================================

export {
  checkPasswordBreach,
  validatePasswordSafety,
  checkMultiplePasswords,
  assessPasswordStrength,
  clearBreachCache,
  handlePasswordBreachCheck,
} from "./password-breach";

export type { BreachCheckResult, BreachCheckOptions } from "./password-breach";

// ============================================================================
// Device Fingerprinting
// ============================================================================

export {
  generateClientFingerprint,
  verifyFingerprint,
  isDeviceTrusted,
  storeFingerprint,
  getStoredFingerprints,
  markDeviceAsTrusted,
  removeFingerprint,
  detectFingerprintAnomalies,
  shouldFlagFingerprint,
  getFingerprintForServer,
  cacheFingerprintLocally,
  getCachedFingerprint,
} from "./device-fingerprinting";

export type {
  DeviceFingerprint,
  FingerprintVerificationResult,
  FingerprintStorage,
} from "./device-fingerprinting";

// ============================================================================
// Session Termination
// ============================================================================

export {
  terminateAllOtherSessions,
  terminateSession,
  terminateAllSessions,
  getUserSessions,
  cleanupExpiredSessions,
  handlePasswordChange,
  handleSessionTermination,
  handleGetSessions,
} from "./session-termination";

export type {
  SessionInfo,
  SessionTerminationResult,
} from "./session-termination";

// ============================================================================
// IP Anomaly Detection
// ============================================================================

export {
  getIPGeolocation,
  detectIPAnomaly,
  getIPHistory,
  addIPToHistory,
  cleanupIPHistory,
  analyzeRequestForAnomaly,
  assessRisk,
  handleIPAnomalyCheck,
} from "./ip-anomaly-detection";

export type {
  IPInfo,
  IPAnomalyResult,
  IPHistory,
} from "./ip-anomaly-detection";

// ============================================================================
// Security Headers Scanner
// ============================================================================

export {
  checkSecurityHeader,
  checkAllSecurityHeaders,
  calculateSecurityScore,
  scanResponseHeaders,
  scanRequestHeaders,
  scanURLHeaders,
  scanMultipleURLs,
  generateSecurityReport,
  handleHeaderScan,
  handleSelfScan,
} from "./headers-scanner";

export type {
  SecurityHeaderConfig,
  HeaderCheckResult,
  SecurityScanResult,
} from "./headers-scanner";

// ============================================================================
// 2FA Backup Codes
// ============================================================================

export {
  generateBackupCodes,
  validateBackupCode,
  consumeBackupCode,
  getBackupCodes,
  getBackupCodeCount,
  regenerateBackupCodes,
  deleteBackupCodes,
  handleGenerateBackupCodes,
  handleValidateBackupCode,
  handleGetBackupCodes,
  handleRegenerateBackupCodes,
} from "./two-factor-backup-codes";

export type {
  BackupCode,
  BackupCodeGenerationResult,
  BackupCodeValidationResult,
} from "./two-factor-backup-codes";
