// tests/settings/AppearanceSettings.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppearanceSettings from '@/app/settings/components/AppearanceSettings';

// Mock toast utils
vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('AppearanceSettings', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      appearance: 'Appearance',
      darkMode: 'Dark Mode',
      current: 'Current',
      light: 'Light',
      system: 'System',
      dark: 'Dark',
      language: 'Language',
      languageUpdated: 'Language Updated',
      languageUpdatedMsg: 'Language changed to',
      switchToEnglish: 'Switch to English',
      switchToSpanish: 'Switch to Spanish',
      switchToFrench: 'Switch to French',
      currentlySelected: '(currently selected)',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    theme: 'system' as const,
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
    language: 'en' as const,
    setLanguage: vi.fn(),
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders appearance settings card', () => {
    render(<AppearanceSettings {...defaultProps} />);

    expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders theme selection buttons', () => {
    render(<AppearanceSettings {...defaultProps} />);

    expect(screen.getByTestId('theme-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-system')).toBeInTheDocument();
    expect(screen.getByTestId('theme-dark')).toBeInTheDocument();
  });

  it('shows current theme as active', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const systemButton = screen.getByTestId('theme-system');
    expect(systemButton).toHaveAttribute('aria-checked', 'true');
  });

  it('calls setTheme when theme button is clicked', () => {
    const setTheme = vi.fn();
    render(<AppearanceSettings {...defaultProps} setTheme={setTheme} />);

    fireEvent.click(screen.getByTestId('theme-dark'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('renders language selection buttons', () => {
    render(<AppearanceSettings {...defaultProps} />);

    expect(screen.getByTestId('language-en')).toBeInTheDocument();
    expect(screen.getByTestId('language-es')).toBeInTheDocument();
    expect(screen.getByTestId('language-fr')).toBeInTheDocument();
  });

  it('shows current language as active', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const englishButton = screen.getByTestId('language-en');
    expect(englishButton).toHaveAttribute('aria-checked', 'true');
  });

  it('calls setLanguage when language button is clicked', () => {
    const setLanguage = vi.fn();
    render(<AppearanceSettings {...defaultProps} setLanguage={setLanguage} />);

    fireEvent.click(screen.getByTestId('language-es'));
    expect(setLanguage).toHaveBeenCalledWith('es');
  });

  it('does not call setLanguage when same language is clicked', () => {
    const setLanguage = vi.fn();
    render(<AppearanceSettings {...defaultProps} setLanguage={setLanguage} />);

    fireEvent.click(screen.getByTestId('language-en'));
    expect(setLanguage).not.toHaveBeenCalled();
  });

  it('uses radiogroup role for theme selection', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const themeGroup = screen.getByRole('radiogroup', { name: 'Dark Mode' });
    expect(themeGroup).toBeInTheDocument();
  });

  it('uses radiogroup role for language selection', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const languageGroup = screen.getByRole('radiogroup', { name: 'Language' });
    expect(languageGroup).toBeInTheDocument();
  });

  it('displays resolved theme info', () => {
    render(<AppearanceSettings {...defaultProps} />);

    expect(screen.getByText(/System \(dark\)/)).toBeInTheDocument();
  });
});
