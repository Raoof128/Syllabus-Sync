import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

vi.mock('@/lib/hooks/useSafeTranslation', () => ({
  useSafeTranslation: () => ({
    t: (k: string, params?: Record<string, string | number>) => {
      if (k === 'googleMapsViewAt' && params?.destination)
        return `Google Maps — ${params.destination}`;
      if (k === 'googleMapsDirectionsTo' && params?.destination)
        return `Directions to ${params.destination}`;
      return k;
    },
    safeT: (_k: string, fallback: string) => fallback,
  }),
}));

const TEST_API_KEY = 'test-embed-key-123';

describe('GoogleMapEmbed', () => {
  const installGeolocationMock = (
    watchImpl?: (success: PositionCallback, error?: PositionErrorCallback) => number,
  ) => {
    const originalGeolocation = navigator.geolocation;
    const clearWatch = vi.fn();
    let successCallback: PositionCallback | null = null;
    let errorCallback: PositionErrorCallback | null = null;
    const watchPosition = vi
      .fn()
      .mockImplementation((success: PositionCallback, error?: PositionErrorCallback) => {
        successCallback = success;
        errorCallback = error || null;
        if (watchImpl) return watchImpl(success, error);
        return 1;
      }) as unknown as Geolocation['watchPosition'];

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

    return {
      watchPosition,
      clearWatch,
      emitSuccess: (position: GeolocationPosition) => successCallback?.(position),
      emitError: (error: GeolocationPositionError) => errorCallback?.(error),
      restore,
    };
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

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  });

  it('renders the iframe in view mode by default', () => {
    render(<GoogleMapEmbed />);
    const iframe = screen.getByTitle('Google Maps — Macquarie University');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('maps/embed/v1/place');
    expect(iframe.getAttribute('src')).toContain(`key=${TEST_API_KEY}`);
  });

  it('switches to directions mode via ref', () => {
    const ref = React.createRef<GoogleMapRef>();
    render(<GoogleMapEmbed ref={ref} />);

    expect(ref.current).toBeTruthy();
    act(() => {
      ref.current?.startNavigation();
    });

    const iframe = screen.getByTitle('Directions to Macquarie University');
    expect(iframe.getAttribute('src')).toContain('maps/embed/v1/directions');
    expect(iframe.getAttribute('src')).toContain(
      `origin=${encodeURIComponent(`${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`)}`,
    );
    expect(iframe.getAttribute('src')).toContain('mode=walking');
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
    expect(iframe.getAttribute('src')).toContain(
      encodeURIComponent('-33.7734389,151.1134919'),
    );
  });

  it('clears geolocation watch on unmount when watch id is 0', () => {
    const { watchPosition, clearWatch, restore } = installGeolocationMock(() => 0);

    const { unmount } = render(<GoogleMapEmbed />);
    expect(watchPosition).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(0);
    restore();
  });

  it('shows live user location in view mode when center button is used', () => {
    const { restore, emitSuccess } = installGeolocationMock(() => 11);

    const { unmount } = render(<GoogleMapEmbed />);

    act(() => {
      emitSuccess(makePosition(-33.7748, 151.1132));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Center on my location' }));

    const iframe = screen.getByTitle('Google Maps — My Location');
    expect(iframe.getAttribute('src')).toContain(
      encodeURIComponent('-33.7748,151.1132'),
    );

    unmount();
    restore();
  });

  it('uses live user location as directions origin when available', () => {
    const { restore, emitSuccess } = installGeolocationMock(() => 15);
    const ref = React.createRef<GoogleMapRef>();

    const { unmount } = render(
      <GoogleMapEmbed
        ref={ref}
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

    act(() => {
      emitSuccess(makePosition(-33.771, 151.114));
      ref.current?.startNavigation();
    });

    const iframe = screen.getByTitle('Directions to 18 Wallys Walk');
    expect(iframe.getAttribute('src')).toContain(
      `origin=${encodeURIComponent('-33.771,151.114')}`,
    );
    expect(iframe.getAttribute('src')).toContain(
      `destination=${encodeURIComponent('-33.7734389,151.1134919')}`,
    );
    expect(iframe.getAttribute('src')).toContain('mode=walking');

    unmount();
    restore();
  });

  it('keeps directions active and updates route when destination changes', () => {
    const { restore } = installGeolocationMock(() => 3);
    const ref = React.createRef<GoogleMapRef>();

    const { rerender, unmount } = render(
      <GoogleMapEmbed
        ref={ref}
        selectedBuilding={{
          id: 'A',
          name: 'Building A',
          position: [0, 0],
          translationKey: 'building_18WW_name',
          descriptionKey: 'building_18WW_desc',
          location: { lat: -33.77, lng: 151.11 },
        }}
        destinationLabel="Building A"
      />,
    );

    act(() => {
      ref.current?.startNavigation();
    });

    rerender(
      <GoogleMapEmbed
        ref={ref}
        selectedBuilding={{
          id: 'B',
          name: 'Building B',
          position: [0, 0],
          translationKey: 'building_18WW_name',
          descriptionKey: 'building_18WW_desc',
          location: { lat: -33.78, lng: 151.12 },
        }}
        destinationLabel="Building B"
      />,
    );

    const iframe = screen.getByTitle('Directions to Building B');
    expect(iframe.getAttribute('src')).toContain(
      `destination=${encodeURIComponent('-33.78,151.12')}`,
    );
    expect(iframe.getAttribute('src')).toContain('mode=walking');

    unmount();
    restore();
  });

  it('emits live navigation state transitions via callback', () => {
    const { restore } = installGeolocationMock();
    const onNavStateChange = vi.fn();
    const ref = React.createRef<GoogleMapRef>();

    const { unmount } = render(<GoogleMapEmbed ref={ref} onNavStateChange={onNavStateChange} />);

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

  describe('fallback (no API key)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    });

    it('renders embedded view iframe when no API key', () => {
      render(<GoogleMapEmbed />);
      const iframe = screen.getByTitle('Google Maps — Macquarie University');
      expect(iframe.getAttribute('src')).toContain('google.com/maps?output=embed');
      expect(iframe.getAttribute('src')).toContain(
        `q=${encodeURIComponent(`${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`)}`,
      );
    });

    it('renders embedded directions iframe when navigating without API key', () => {
      const ref = React.createRef<GoogleMapRef>();
      render(
        <GoogleMapEmbed
          ref={ref}
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

      act(() => {
        ref.current?.startNavigation();
      });

      const iframe = screen.getByTitle('Directions to 18 Wallys Walk');
      expect(iframe.getAttribute('src')).toContain('google.com/maps?output=embed');
      expect(iframe.getAttribute('src')).toContain(
        `saddr=${encodeURIComponent(`${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`)}`,
      );
      expect(iframe.getAttribute('src')).toContain(
        `daddr=${encodeURIComponent('-33.7734389,151.1134919')}`,
      );
      expect(iframe.getAttribute('src')).toContain('dirflg=w');
    });
  });
});
