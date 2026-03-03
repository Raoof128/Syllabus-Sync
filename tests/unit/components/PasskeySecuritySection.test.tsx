import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasskeySecuritySection } from '@/features/settings/components/security/PasskeySecuritySection';
import { vi, describe, it, expect } from 'vitest';

// Mock useBiometrics hook since it's used in the component
vi.mock('@/lib/hooks/useBiometrics', () => ({
  useBiometrics: () => ({
    biometricEnabled: false,
    biometricAvailable: true,
    platformAuthAvailable: true,
    isLoading: false,
    isStatusLoading: false,
    enableBiometric: vi.fn().mockResolvedValue(true),
    disableBiometric: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock fetch globally for credentials API
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ credentials: [] }),
});
globalThis.fetch = mockFetch;

describe('PasskeySecuritySection', () => {
  const mockT = (key: string) => key;

  it('shows enabled state correctly', async () => {
    render(<PasskeySecuritySection t={mockT} />);
    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: 'biometricLogin' });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('calls toggle function when clicked', async () => {
    render(<PasskeySecuritySection t={mockT} />);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'biometricLogin' })).toBeInTheDocument();
    });
    const toggle = screen.getByRole('switch', { name: 'biometricLogin' });
    fireEvent.click(toggle);
    // It should open the enable dialog
    expect(screen.getByText('enableBiometricDesc')).toBeInTheDocument();
  });

  it('renders passkeys list header', async () => {
    render(<PasskeySecuritySection t={mockT} />);
    await waitFor(() => {
      expect(screen.getByText('registeredDevicesAndKeys')).toBeInTheDocument();
    });
  });
});
