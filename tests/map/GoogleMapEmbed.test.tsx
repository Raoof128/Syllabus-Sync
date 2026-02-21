import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoogleMapEmbed, type GoogleMapRef } from '@/features/map/components/GoogleMapEmbed';

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({
    t: (k: string, params?: Record<string, string | number>) => {
      if (k === 'googleMapsViewAt' && params?.destination)
        return `Google Maps — ${params.destination}`;
      if (k === 'googleMapsDirectionsTo' && params?.destination)
        return `Directions to ${params.destination}`;
      return k;
    },
  }),
}));

describe('GoogleMapEmbed', () => {
  it('renders the iframe in view mode by default', () => {
    render(<GoogleMapEmbed />);
    const iframe = screen.getByTitle('Google Maps — Macquarie University');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('output=embed');
  });

  it('switches to directions mode via ref', () => {
    const ref = React.createRef<GoogleMapRef>();
    render(<GoogleMapEmbed ref={ref} />);

    expect(ref.current).toBeTruthy();
    act(() => {
      ref.current?.startNavigation();
    });

    const iframe = screen.getByTitle('Directions to Macquarie University');
    expect(iframe.getAttribute('src')).toContain('saddr=My+Location');
    expect(iframe.getAttribute('src')).toContain('dirflg=w');
  });

  it('switches back to view mode via ref or back button', () => {
    const ref = React.createRef<GoogleMapRef>();
    render(<GoogleMapEmbed ref={ref} />);

    act(() => {
      ref.current?.startNavigation();
    });

    fireEvent.click(screen.getByRole('button', { name: 'backToMap' }));

    expect(screen.getByTitle('Google Maps — Macquarie University')).toBeTruthy();
  });

  it('uses selected building coordinates as destination when provided', () => {
    render(
      <GoogleMapEmbed
        selectedBuilding={{
          id: '18WW',
          name: '18 Wallys Walk',
          position: [0, 0],
          translationKey: 'building_18WW_name',
          descriptionKey: 'building_18WW_desc',
          location: { lat: -33.7734389, lng: 151.1134919 },
        }}
        destinationLabel="18 Wallys Walk"
      />,
    );

    const iframe = screen.getByTitle('Google Maps — 18 Wallys Walk');
    expect(iframe.getAttribute('src')).toContain('-33.7734389,151.1134919');
  });
});
