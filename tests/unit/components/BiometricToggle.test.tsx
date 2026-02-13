import { render, screen, fireEvent } from '@testing-library/react';
import { BiometricToggle } from '@/features/settings/components/security/BiometricToggle';
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

describe('BiometricToggle', () => {
  const mockT = (key: string) => key;

  it('shows enabled state correctly', () => {
    render(<BiometricToggle t={mockT} />);
    // Component uses ToggleControl (role="switch") instead of a button
    const toggle = screen.getByRole('switch', { name: 'biometricLogin' });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls toggle function when clicked', () => {
    render(<BiometricToggle t={mockT} />);
    const toggle = screen.getByRole('switch', { name: 'biometricLogin' });
    fireEvent.click(toggle);
    // It should open the enable dialog
    expect(screen.getByText('enableBiometricDesc')).toBeInTheDocument();
  });
});
