import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoogleMapEmbed } from '@/features/map/components/GoogleMapEmbed';

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({ t: (k: string) => k }),
}));

describe('GoogleMapEmbed', () => {
  it('renders the iframe in view mode by default', () => {
    render(<GoogleMapEmbed />);
    const iframe = screen.getByTitle('Google Maps — Macquarie University');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('output=embed');
  });

  it('switches to directions mode on Navigate click', () => {
    render(<GoogleMapEmbed />);
    fireEvent.click(screen.getByRole('button', { name: 'navigateToMQ' }));
    const iframe = screen.getByTitle('Directions to Macquarie University');
    expect(iframe.getAttribute('src')).toContain('saddr=My+Location');
  });

  it('switches back to view mode on Back to Map click', () => {
    render(<GoogleMapEmbed />);
    fireEvent.click(screen.getByRole('button', { name: 'navigateToMQ' }));
    fireEvent.click(screen.getByRole('button', { name: 'backToMap' }));
    expect(screen.getByTitle('Google Maps — Macquarie University')).toBeTruthy();
  });
});
