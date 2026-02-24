import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoogleMapEmbed, type GoogleMapRef } from '@/features/map/components/GoogleMapEmbed';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';

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
  const installGeolocationMock = (
    watchImpl?: (success: PositionCallback) => number,
  ) => {
    const originalGeolocation = navigator.geolocation;
    const clearWatch = vi.fn();
    const watchPosition = vi
      .fn()
      .mockImplementation(
        watchImpl || (() => 1),
      ) as unknown as Geolocation['watchPosition'];

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition,
        clearWatch,
      } as unknown as Geolocation,
    });

    const restore = () => {
      if (typeof originalGeolocation === 'undefined') {
        Reflect.deleteProperty(navigator, 'geolocation');
        return;
      }
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: originalGeolocation,
      });
    };

    return { watchPosition, clearWatch, restore };
  };

  const makePosition = (lat: number, lng: number): GeolocationPosition =>
    ({
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    }) as GeolocationPosition;

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
    expect(iframe.getAttribute('src')).toContain(
      `saddr=${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`,
    );
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

  it('clears geolocation watch on unmount when watch id is 0', () => {
    const { watchPosition, clearWatch, restore } = installGeolocationMock(
      () => 0,
    );

    const { unmount } = render(<GoogleMapEmbed />);
    expect(watchPosition).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(0);
    restore();
  });

  it('shows live user location in view mode when center button is used', () => {
    let successCallback: PositionCallback | null = null;
    const { restore } = installGeolocationMock((success: PositionCallback) => {
      successCallback = success;
      return 11;
    });

    const { unmount } = render(<GoogleMapEmbed />);

    act(() => {
      successCallback?.(makePosition(-33.7748, 151.1132));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Center on my location' }));

    const iframe = screen.getByTitle('Google Maps — My Location');
    expect(iframe.getAttribute('src')).toContain('q=-33.7748,151.1132');

    unmount();
    restore();
  });

  it('emits live navigation state transitions via callback', () => {
    const { restore } = installGeolocationMock();
    const onNavStateChange = vi.fn();
    const ref = React.createRef<GoogleMapRef>();

    const { unmount } = render(
      <GoogleMapEmbed ref={ref} onNavStateChange={onNavStateChange} />,
    );

    act(() => {
      ref.current?.startNavigation();
    });
    act(() => {
      ref.current?.stopNavigation();
    });

    expect(onNavStateChange).toHaveBeenCalledWith({
      isNavigating: true,
      status: 'navigating',
    });
    expect(onNavStateChange).toHaveBeenCalledWith({
      isNavigating: false,
      status: 'idle',
    });

    unmount();
    restore();
  });
});
