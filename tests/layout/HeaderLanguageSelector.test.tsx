import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HeaderLanguageSelector from '@/components/layout/HeaderLanguageSelector';

const toastSuccess = vi.fn();

vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('HeaderLanguageSelector', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      language: 'Language',
      current: 'Current',
      languageUpdated: 'Language Updated',
      languageUpdatedMsg: 'Language changed to',
    };

    return translations[key] || key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const openMenu = () => {
    fireEvent.pointerDown(screen.getByTestId('header-language-trigger'), {
      button: 0,
      ctrlKey: false,
    });
  };

  it('renders the current language on the trigger', () => {
    render(<HeaderLanguageSelector language="en" setLanguage={vi.fn()} t={mockT as never} />);

    expect(screen.getByTestId('header-language-trigger')).toHaveAttribute(
      'aria-label',
      'Language: English',
    );
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('changes the language when a new option is selected', async () => {
    const setLanguage = vi.fn().mockResolvedValue(undefined);

    render(<HeaderLanguageSelector language="en" setLanguage={setLanguage} t={mockT as never} />);

    openMenu();
    fireEvent.click(screen.getByTestId('header-language-fr'));

    await waitFor(() => {
      expect(setLanguage).toHaveBeenCalledWith('fr');
    });
    expect(toastSuccess).toHaveBeenCalledWith('Language Updated', 'Language changed to Français');
  });

  it('does not reapply the same language', async () => {
    const setLanguage = vi.fn().mockResolvedValue(undefined);

    render(<HeaderLanguageSelector language="en" setLanguage={setLanguage} t={mockT as never} />);

    openMenu();
    fireEvent.click(screen.getByTestId('header-language-en'));

    await waitFor(() => {
      expect(setLanguage).not.toHaveBeenCalled();
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
