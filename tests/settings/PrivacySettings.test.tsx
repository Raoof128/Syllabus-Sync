// tests/settings/PrivacySettings.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import PrivacySettings from '@/app/settings/components/PrivacySettings';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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
      privacySecurity: 'Privacy & Security',
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

  const mockSessions = [
    { id: '1', device: 'Chrome on Mac', lastActive: new Date().toISOString(), current: true },
    {
      id: '2',
      device: 'Firefox on Windows',
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      current: false,
    },
  ];

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
  });

  // Basic rendering tests
  it('renders privacy settings card', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByTestId('privacy-settings')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
  });

  it('renders change password button', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByTestId('change-password-button')).toBeInTheDocument();
  });

  it('renders manage sessions button', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByTestId('manage-sessions-button')).toBeInTheDocument();
  });

  it('renders privacy policy button', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByTestId('privacy-policy-button')).toBeInTheDocument();
  });

  it('renders export data button', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
  });

  // Password dialog tests
  it('opens password dialog when change password button is clicked', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    expect(screen.getByTestId('password-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('current-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
  });

  it('toggles current password visibility', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    const input = screen.getByTestId('current-password-input');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByTestId('toggle-current-password'));
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByTestId('toggle-current-password'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows password strength indicator when typing new password', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    const newPasswordInput = screen.getByTestId('new-password-input');
    fireEvent.change(newPasswordInput, { target: { value: 'test' } });

    expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows strong password indicator for complex passwords', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    const newPasswordInput = screen.getByTestId('new-password-input');
    fireEvent.change(newPasswordInput, { target: { value: 'MyStr0ng!Pass' } });

    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    fireEvent.change(screen.getByTestId('new-password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'different123' },
    });

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls API when password form is submitted', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('change-password-button'));

    fireEvent.change(screen.getByTestId('current-password-input'), {
      target: { value: 'currentPassword' },
    });
    fireEvent.change(screen.getByTestId('new-password-input'), {
      target: { value: 'newPassword123!' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'newPassword123!' },
    });

    fireEvent.click(screen.getByTestId('submit-password-change'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123!',
        }),
      });
    });
  });

  // Sessions dialog tests
  it('opens sessions dialog when manage sessions button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { sessions: mockSessions } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    act(() => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/sessions');
    });

    expect(screen.getByTestId('sessions-dialog')).toBeInTheDocument();
  });

  it('renders sessions in the dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { sessions: mockSessions } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-1')).toBeInTheDocument();
      expect(screen.getByTestId('session-2')).toBeInTheDocument();
    });
  });

  it('disables sign out button for current session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { sessions: mockSessions } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });

    const currentSessionButton = await screen.findByTestId('end-session-1');
    expect(currentSessionButton).toBeDisabled();
  });

  it('calls sessions API when ending a non-current session', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { sessions: mockSessions } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { sessions: mockSessions } }),
      });

    render(<PrivacySettings {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });
    const sessionButton = await screen.findByTestId('end-session-2');
    fireEvent.click(sessionButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'others' }),
      });
    });
  });

  it('renders end all sessions button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { sessions: mockSessions } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    act(() => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });

    expect(await screen.findByTestId('end-all-sessions-button')).toBeInTheDocument();
  });

  // Privacy policy test
  it('opens privacy policy link when button is clicked', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('privacy-policy-button'));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com/privacy',
      '_blank',
      'noopener,noreferrer',
    );
  });

  // Export dialog tests
  it('opens export dialog when export button is clicked', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('export-data-button'));

    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
  });

  it('shows export warning in dialog', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('export-data-button'));

    expect(screen.getByText('This file may contain sensitive information')).toBeInTheDocument();
  });

  it('triggers download when confirm export is clicked', () => {
    render(<PrivacySettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId('export-data-button'));
    fireEvent.click(screen.getByTestId('confirm-export-button'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  // Accessibility tests
  it('has proper region role for accessibility', () => {
    render(<PrivacySettings {...defaultProps} />);

    expect(screen.getByRole('region', { name: 'Privacy & Security' })).toBeInTheDocument();
  });

  it('renders section headings as h3 elements', () => {
    render(<PrivacySettings {...defaultProps} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThanOrEqual(4);
  });

  it('has proper list role in sessions dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { sessions: mockSessions } }),
    });

    render(<PrivacySettings {...defaultProps} />);

    act(() => {
      fireEvent.click(screen.getByTestId('manage-sessions-button'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/sessions');
    });
    expect(screen.getByRole('list', { name: 'Manage Sessions' })).toBeInTheDocument();
  });
});
