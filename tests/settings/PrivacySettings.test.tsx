// tests/settings/PrivacySettings.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import PrivacySettings from '@/features/settings/components/PrivacySettings';

// Mock next/navigation — share a stable push reference so tests can assert on it
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Mock toast utils
vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock error handler
vi.mock('@/lib/utils/errorHandling', () => ({
  errorHandler: {
    logError: vi.fn(),
  },
}));

// Mock config
vi.mock('@/lib/config', () => ({
  APP_CONFIG: {
    version: '1.0.0',
  },
  EXTERNAL_LINKS: {
    privacy: 'https://example.com/privacy',
  },
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  STORAGE_KEYS: {
    SESSIONS: 'syllabus-sync-sessions',
  },
}));

// Mock constants/config
vi.mock('@/lib/constants/config', () => ({
  API_ROUTES: {
    AUTH: {
      MFA_STATUS: '/api/auth/mfa/status',
      PASSWORD: '/api/auth/password',
    },
  },
  SECURITY_CONFIG: {
    MIN_PASSWORD_LENGTH: 12,
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT_MINS: 30,
  },
}));

// Mock security components that use react-query
vi.mock('@/features/settings/components/security/PasskeySecuritySection', () => ({
  PasskeySecuritySection: () => (
    <div data-testid="passkey-security-section">Passkey & Biometric Login</div>
  ),
}));

vi.mock('@/features/settings/components/security/TOTPSetup', () => ({
  TOTPSetup: () => <div data-testid="totp-setup">TOTP Setup</div>,
}));

vi.mock('@/features/settings/components/security/SMSSetup', () => ({
  SMSSetup: () => <div data-testid="sms-setup">SMS Setup</div>,
}));

// Mock useSessionManager hook
const mockFetchSessions = vi.fn();
const mockEndSession = vi.fn();
const mockEndAllSessions = vi.fn();
let mockSessionsData: any[] = [];
let mockIsLoadingSessions = false;

vi.mock('@/lib/hooks/useSessionManager', () => ({
  useSessionManager: () => ({
    sessions: mockSessionsData,
    isLoadingSessions: mockIsLoadingSessions,
    fetchSessions: mockFetchSessions,
    endSession: mockEndSession,
    endAllSessions: mockEndAllSessions,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:test');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

describe('PrivacySettings', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      security: 'Security',
      changePassword: 'Change Password',
      changePasswordDesc: 'Update your account password',
      changePasswordTitle: 'Change Password',
      changePasswordDialogDesc: 'Enter your current and new password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      passwordChangedSuccess: 'Password changed successfully',
      passwordsDoNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      allFieldsRequired: 'All fields are required',
      settingsError: 'Settings Error',
      preferenceError: 'Failed to update preference',
      tooManyAttempts: 'Too many attempts. Please try again later.',
      cancel: 'Cancel',
      loading: 'Loading...',
      passwordWeak: 'Weak',
      passwordFair: 'Fair',
      passwordGood: 'Good',
      passwordStrong: 'Strong',
      manageSessions: 'Manage Sessions',
      manageSessionsDesc: 'View and manage active sessions',
      noSessions: 'No active sessions',
      current: 'Current Session',
      lastActive: 'Last active:',
      signOut: 'Sign Out',
      signOutAllSessions: 'Sign Out All Sessions',
      close: 'Close',
      preferenceUpdated: 'Preference Updated',
      privacyPolicy: 'Privacy Policy',
      privacyPolicyDesc: 'Read our privacy policy',
      view: 'View',
      exportData: 'Export Data',
      exportDataDesc: 'Download your data',
      export: 'Export',
      confirmExport: 'Confirm Export',
      confirmExportDesc: 'Are you sure you want to export your data?',
      exportWarning: 'This file may contain sensitive information',
      proceedExport: 'Export Data',
      exportComplete: 'Export Complete',
      exportCompleteMsg: 'Your data has been exported',
      exportFailed: 'Export Failed',
      exportFailedMsg: 'Failed to export data',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    t: mockT,
    units: [],
    deadlines: [],
    theme: 'dark',
    language: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetchSessions.mockReset();
    mockEndSession.mockReset();
    mockEndAllSessions.mockReset();
    mockSessionsData = [];
    mockIsLoadingSessions = false;
  });

  // Basic rendering tests
  it('renders privacy settings card', async () => {
    // Mock MFA status fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('privacy-settings')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
  });

  it('renders export data button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
    });
  });

  // Export dialog tests
  it('opens export dialog when export button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('export-data-button'));

    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
  });

  it('shows export warning in dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('export-data-button'));

    expect(screen.getByText('This file may contain sensitive information')).toBeInTheDocument();
  });

  it('triggers download when confirm export is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('export-data-button'));
    fireEvent.click(screen.getByTestId('confirm-export-button'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  // Accessibility tests
  it('has proper region role for accessibility', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Security' })).toBeInTheDocument();
    });
  });

  it('renders section headings as h3 elements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { factors: [] } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });
});
