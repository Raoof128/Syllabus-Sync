// tests/settings/HelpSupport.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpSupport from '@/app/settings/components/HelpSupport';

// Mock toast utils
vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock config
vi.mock('@/lib/config', () => ({
  APP_CONFIG: {
    version: '1.0.0',
  },
  EXTERNAL_LINKS: {
    documentation: 'https://docs.example.com',
    feedback: 'mailto:feedback@example.com',
  },
}));

// Mock window.open and window.location
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('HelpSupport', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      helpSupport: 'Help & Support',
      aboutTitle: 'About',
      version: 'Version',
      aboutDesc: 'Campus navigation and schedule management app',
      needHelp: 'Need Help?',
      helpDesc: 'Check our documentation for guides and tutorials',
      viewDocumentation: 'View Documentation',
      documentationOpening: 'Opening documentation...',
      feedback: 'Send Feedback',
      feedbackDesc: 'Help us improve by sharing your thoughts',
      sendFeedback: 'Send Feedback',
      feedbackPreparing: 'Preparing feedback form...',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders help support card', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByTestId('help-support')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('renders about section with version', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText(/Version 1.0.0/)).toBeInTheDocument();
    expect(screen.getByText(/Campus navigation and schedule management app/)).toBeInTheDocument();
  });

  it('renders need help section', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(
      screen.getByText('Check our documentation for guides and tutorials'),
    ).toBeInTheDocument();
  });

  it('renders view documentation button', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByTestId('view-documentation-button')).toBeInTheDocument();
    expect(screen.getByText('View Documentation')).toBeInTheDocument();
  });

  it('opens documentation link when button is clicked', () => {
    render(<HelpSupport {...defaultProps} />);

    fireEvent.click(screen.getByTestId('view-documentation-button'));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://docs.example.com',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('renders feedback section', () => {
    render(<HelpSupport {...defaultProps} />);

    // Use getAllByText since "Send Feedback" appears multiple times (heading + button)
    expect(screen.getAllByText('Send Feedback').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Help us improve by sharing your thoughts')).toBeInTheDocument();
  });

  it('renders send feedback button', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByTestId('send-feedback-button')).toBeInTheDocument();
  });

  it('has proper region role for accessibility', () => {
    render(<HelpSupport {...defaultProps} />);

    expect(screen.getByRole('region', { name: 'Help & Support' })).toBeInTheDocument();
  });

  it('renders section headings as h3 elements', () => {
    render(<HelpSupport {...defaultProps} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });
});
