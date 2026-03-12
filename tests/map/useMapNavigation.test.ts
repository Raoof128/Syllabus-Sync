import { renderHook, act } from '@testing-library/react';
import { useMapNavigation } from '@/features/map/hooks/useMapNavigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavigationStateManager } from '@/features/map/lib/realtimeNavigation';
import * as orsService from '@/lib/services/ors';
import { toastUtils } from '@/lib/utils/toast';
import type { Building } from '@/features/map/lib/buildings';

// Mock dependencies
vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/services/ors', () => ({
  fetchORSRoute: vi.fn(),
}));

// Mock NavigationStateManager
const mockNavManager = {
  setOnStateChange: vi.fn(),
  startNavigation: vi.fn(),
  stopNavigation: vi.fn(),
  updatePosition: vi.fn(),
  setMotionState: vi.fn(),
} as unknown as NavigationStateManager;

describe('useMapNavigation', () => {
  const mockNavManagerRef = { current: mockNavManager };
  const mockGpsToCrsSimple = vi.fn((lat, lng) => ({ lat, lng }));
  const mockGetBuildingLatLng = vi.fn(() => ({ lat: 10, lng: 10 }));
  const fetchORSRouteMock = vi.mocked(orsService.fetchORSRoute);
  type HookProps = Parameters<typeof useMapNavigation>[0];

  const createBuilding = (id: string, lat: number = 1, lng: number = 1): Building =>
    ({
      id,
      name: `Building ${id}`,
      position: [0, 0],
      translationKey: 'navigation',
      descriptionKey: 'mapLayersDesc',
      location: { lat, lng },
      category: 'academic',
    }) as unknown as Building;

  type RouteResponse = Awaited<ReturnType<typeof orsService.fetchORSRoute>>;

  const defaultProps: HookProps = {
    selectedBuilding: undefined,
    origin: null,
    isOffCampus: false,
    navManagerRef: mockNavManagerRef,
    gpsToCrsSimple: mockGpsToCrsSimple,
    getBuildingLatLng: mockGetBuildingLatLng,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useMapNavigation(defaultProps));

    expect(result.current.isNavigating).toBe(false);
    expect(result.current.routeCoords).toEqual([]);
    expect(result.current.preview).toBeNull();
    expect(result.current.routeError).toBeNull();
  });

  it('should fetch route when origin and selectedBuilding are present', async () => {
    const mockRouteData: RouteResponse = {
      coordinates: [
        [0, 0],
        [1, 1],
      ], // [lng, lat] from ORS
      preview: { distanceMeters: 100, durationSeconds: 60, steps: [] },
    };

    fetchORSRouteMock.mockResolvedValue(mockRouteData);

    const props: HookProps = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result } = renderHook(() => useMapNavigation(props));

    // Trigger timeout
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Allow async state updates to flush
    await act(async () => {});

    expect(result.current.preview).toEqual(mockRouteData.preview);

    expect(orsService.fetchORSRoute).toHaveBeenCalledWith(
      props.origin,
      expect.anything(), // destGps
      expect.any(AbortSignal), // abort signal
    );
    // gpsRouteCoords is internal, so we check routeCoords (pixel) or preview
    expect(result.current.routeCoords.length).toBeGreaterThan(0);
  });

  it('should prevent navigation if off-campus', () => {
    const props = {
      ...defaultProps,
      isOffCampus: true,
    };

    const { result } = renderHook(() => useMapNavigation(props));

    act(() => {
      result.current.startNavigation();
    });

    expect(result.current.isNavigating).toBe(false);
    expect(toastUtils.warning).toHaveBeenCalledWith(
      'locationOutsideCampusTitle',
      'locationOutsideCampusMessage',
    );
  });

  it('should not fetch route while off-campus', async () => {
    const props: HookProps = {
      ...defaultProps,
      isOffCampus: true,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result } = renderHook(() => useMapNavigation(props));

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    expect(orsService.fetchORSRoute).not.toHaveBeenCalled();
    expect(result.current.preview).toBeNull();
    expect(result.current.routeCoords).toEqual([]);
  });

  it('should start navigation when conditions are met', async () => {
    const mockRouteData: RouteResponse = {
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      preview: { distanceMeters: 100, durationSeconds: 60, steps: [] },
    };
    fetchORSRouteMock.mockResolvedValue(mockRouteData);

    const props: HookProps = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result } = renderHook(() => useMapNavigation(props));

    // Wait for route to load
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    expect(result.current.preview).not.toBeNull();

    // Start navigation
    act(() => {
      result.current.startNavigation();
    });

    expect(result.current.isNavigating).toBe(true);
    expect(mockNavManager.startNavigation).toHaveBeenCalled();
    expect(toastUtils.success).toHaveBeenCalled();
  });

  it('should stop active navigation when destination changes', async () => {
    const mockRouteData: RouteResponse = {
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      preview: { distanceMeters: 100, durationSeconds: 60, steps: [] },
    };
    fetchORSRouteMock.mockResolvedValue(mockRouteData);

    const initialProps: HookProps = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result, rerender } = renderHook((props) => useMapNavigation(props), { initialProps });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    act(() => {
      result.current.startNavigation();
    });
    expect(result.current.isNavigating).toBe(true);

    act(() => {
      rerender({
        ...initialProps,
        selectedBuilding: createBuilding('b2', 1.01, 1.01),
      });
    });

    await act(async () => {});

    expect(mockNavManager.stopNavigation).toHaveBeenCalled();
    expect(result.current.isNavigating).toBe(false);
    expect(toastUtils.info).toHaveBeenCalledWith(
      'destinationChanged',
      'restartNavigationForNewDestination',
    );
  });

  it('should stop active navigation when destination is cleared', async () => {
    const mockRouteData: RouteResponse = {
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      preview: { distanceMeters: 100, durationSeconds: 60, steps: [] },
    };
    fetchORSRouteMock.mockResolvedValue(mockRouteData);

    const initialProps: HookProps = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result, rerender } = renderHook((props) => useMapNavigation(props), { initialProps });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    act(() => {
      result.current.startNavigation();
    });
    expect(result.current.isNavigating).toBe(true);

    act(() => {
      rerender({ ...initialProps, selectedBuilding: undefined });
    });

    await act(async () => {});

    expect(mockNavManager.stopNavigation).toHaveBeenCalled();
    expect(result.current.isNavigating).toBe(false);
  });

  it('should stop active navigation when user goes off-campus', async () => {
    const mockRouteData: RouteResponse = {
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      preview: { distanceMeters: 100, durationSeconds: 60, steps: [] },
    };
    fetchORSRouteMock.mockResolvedValue(mockRouteData);

    const initialProps: HookProps = {
      ...defaultProps,
      isOffCampus: false,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: createBuilding('b1'),
    };

    const { result, rerender } = renderHook((props) => useMapNavigation(props), { initialProps });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    act(() => {
      result.current.startNavigation();
    });
    expect(result.current.isNavigating).toBe(true);

    act(() => {
      rerender({ ...initialProps, isOffCampus: true });
    });

    await act(async () => {});

    expect(mockNavManager.stopNavigation).toHaveBeenCalled();
    expect(result.current.isNavigating).toBe(false);
    expect(toastUtils.warning).toHaveBeenCalledWith(
      'locationOutsideCampusTitle',
      'locationOutsideCampusMessage',
    );
  });
});
