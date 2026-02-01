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
    SESSIONS: '/api/auth/sessions',
    PASSKEY_REGISTER_OPTIONS: '/api/auth/passkey/register-options',
    PASSKEY_REGISTER: '/api/auth/passkey/register',
    PASSKEY_OPTIONS: '/api/auth/passkey/options',
    PASSKEY_VERIFY: '/api/auth/passkey/verify',
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
