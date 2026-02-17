export const API_ROUTES = {
  AUTH: {
    BIOMETRIC_REGISTER: '/api/auth/biometric/register',
    BIOMETRIC_TOGGLE: '/api/auth/biometric',
    SESSION_REVOKE: '/api/auth/session/revoke',
    LOGIN: '/api/auth/signin',
    LOGOUT: '/api/auth/signout',
    SIGNUP: '/api/auth/signup',
    USER: '/api/auth/user',
    PASSWORD: '/api/auth/password',
    // Password reset (custom, via Resend)
    PASSWORD_REQUEST_RESET: '/api/auth/password/request-reset',
    PASSWORD_RESET: '/api/auth/password/reset',
    PASSWORD_CLEANUP: '/api/auth/password/cleanup',
    SESSIONS: '/api/auth/sessions',
    PASSKEY_REGISTER_OPTIONS: '/api/auth/passkey/register-options',
    PASSKEY_REGISTER: '/api/auth/passkey/register',
    PASSKEY_OPTIONS: '/api/auth/passkey/options',
    PASSKEY_VERIFY: '/api/auth/passkey/verify',
    // MFA routes
    MFA_STATUS: '/api/auth/mfa/status',
    MFA_ENROLL: '/api/auth/mfa/enroll',
    MFA_VERIFY: '/api/auth/mfa/verify',
    MFA_CHALLENGE_VERIFY: '/api/auth/mfa/challenge-verify',
    MFA_UNENROLL: '/api/auth/mfa/unenroll',
    MFA_SMS_ENROLL: '/api/auth/mfa/sms/enroll',
    MFA_SMS_VERIFY: '/api/auth/mfa/sms/verify',
    // Email verification routes (custom, via Resend)
    EMAIL_SEND_VERIFICATION: '/api/auth/email/send-verification',
    EMAIL_RESEND_VERIFICATION: '/api/auth/email/resend-verification',
    EMAIL_VERIFY: '/api/auth/email/verify',
    EMAIL_CLEANUP: '/api/auth/email/cleanup',
    // WebAuthn routes (enhanced, DB-backed)
    WEBAUTHN_REGISTER_OPTIONS: '/api/webauthn/register/options',
    WEBAUTHN_REGISTER_VERIFY: '/api/webauthn/register/verify',
    WEBAUTHN_AUTH_OPTIONS: '/api/webauthn/authenticate/options',
    WEBAUTHN_AUTH_VERIFY: '/api/webauthn/authenticate/verify',
    WEBAUTHN_CREDENTIALS: '/api/webauthn/credentials',
  },
  USER: {
    EXPORT: '/api/user/export',
    DELETE: '/api/user/delete',
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
  },
} as const;

export const SECURITY_CONFIG = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINS: 30,
} as const;
