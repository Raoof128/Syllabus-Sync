/**
 * Real-time Navigation Tests
 * Tests for GPS smoothing, route tracking, and navigation state management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  GpsPositionSmoother,
  NavigationStateManager,
  findClosestPointOnRoute,
  calculateRemainingDistance,
  generateNavigationText,
  formatETA,
  OFF_ROUTE_THRESHOLD,
} from '@/features/map/lib/realtimeNavigation';

describe('GpsPositionSmoother', () => {
  let smoother: GpsPositionSmoother;

  beforeEach(() => {
    smoother = new GpsPositionSmoother();
  });

  it('should smooth GPS positions with Kalman filter', () => {
    // Simulate a series of noisy GPS positions
    const positions = [
      {
        lat: -33.7737,
        lng: 151.1126,
        accuracy: 10,
        heading: null,
        speed: null,
        timestamp: 1000,
      },
      {
        lat: -33.7738,
        lng: 151.1127,
        accuracy: 12,
        heading: null,
        speed: null,
        timestamp: 2000,
      },
      {
        lat: -33.7736,
        lng: 151.1125,
        accuracy: 8,
        heading: null,
        speed: null,
        timestamp: 3000,
      }, // Noisy jump
      {
        lat: -33.7739,
        lng: 151.1128,
        accuracy: 10,
        heading: null,
        speed: null,
        timestamp: 4000,
      },
    ];

    let lastSmoothed = null;
    for (const pos of positions) {
      lastSmoothed = smoother.update(pos);
    }

    expect(lastSmoothed).not.toBeNull();
    expect(lastSmoothed?.smoothedLat).toBeCloseTo(-33.7738, 3);
    expect(lastSmoothed?.smoothedLng).toBeCloseTo(151.1127, 3);
    expect(lastSmoothed?.confidence).toBeGreaterThan(0);
  });

  it('should calculate movement heading from position history', () => {
    // Simulate walking north
    const positions = [
      {
        lat: -33.774,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 1000,
      },
      {
        lat: -33.7738,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 2000,
      },
      {
        lat: -33.7736,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 3000,
      },
    ];

    for (const pos of positions) {
      smoother.update(pos);
    }

    const heading = smoother.calculateMovementHeading();
    // Heading should be roughly north (0°) ± tolerance
    // North can be 0° or close to 360° due to wrapping
    expect(heading).not.toBeNull();
    // Check if heading is within 20° of north (either 0-20 or 340-360)
    const isNorth = (heading! >= 0 && heading! <= 20) || (heading! >= 340 && heading! <= 360);
    expect(isNorth).toBe(true);
  });

  it('should calculate speed from position history', () => {
    // Simulate walking at ~5 km/h (~1.4 m/s)
    // Moving ~2.8m in 2 seconds
    const positions = [
      {
        lat: -33.7737,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 1000,
      },
      {
        lat: -33.77368,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 2000,
      }, // ~2.2m north
      {
        lat: -33.77366,
        lng: 151.1126,
        accuracy: 5,
        heading: null,
        speed: null,
        timestamp: 3000,
      }, // ~2.2m north
    ];

    for (const pos of positions) {
      smoother.update(pos);
    }

    const speed = smoother.calculateSpeed();
    // Speed should be approximately 1.1-2.2 m/s for walking
    expect(speed).toBeGreaterThan(0.5);
    expect(speed).toBeLessThan(3.0);
  });

  it('should reset properly', () => {
    smoother.update({
      lat: -33.7737,
      lng: 151.1126,
      accuracy: 10,
      heading: null,
      speed: null,
      timestamp: 1000,
    });

    smoother.reset();

    const history = smoother.getHistory();
    expect(history.length).toBe(0);
  });
});

describe('findClosestPointOnRoute', () => {
  it('should find closest point on a simple route', () => {
    // Route from A to B (west to east)
    const route: [number, number][] = [
      [151.112, -33.7737], // [lng, lat]
      [151.113, -33.7737],
    ];

    // User slightly north of the route midpoint
    const result = findClosestPointOnRoute(-33.7735, 151.1125, route);

    expect(result.distance).toBeLessThan(30); // Should be close to route
    expect(result.segmentIndex).toBe(0);
    expect(result.closestPoint[0]).toBeCloseTo(151.1125, 3); // lng
    expect(result.closestPoint[1]).toBeCloseTo(-33.7737, 3); // lat on the route
  });

  it('should detect user far from route', () => {
    const route: [number, number][] = [
      [151.112, -33.7737],
      [151.113, -33.7737],
    ];

    // User 100m north of route
    const result = findClosestPointOnRoute(-33.7727, 151.1125, route);

    expect(result.distance).toBeGreaterThan(OFF_ROUTE_THRESHOLD);
  });
});

describe('calculateRemainingDistance', () => {
  it('should calculate remaining distance correctly', () => {
    // Simple route: ~100m total
    const route: [number, number][] = [
      [151.112, -33.7737],
      [151.1125, -33.7737], // ~55m
      [151.113, -33.7737], // ~55m more
    ];

    // At start of route
    const remaining = calculateRemainingDistance(route, 0, 0);
    expect(remaining).toBeGreaterThan(80);
    expect(remaining).toBeLessThan(150);

    // Halfway through first segment
    const remainingMid = calculateRemainingDistance(route, 0, 0.5);
    expect(remainingMid).toBeLessThan(remaining);
  });
});

describe('NavigationStateManager', () => {
  let manager: NavigationStateManager;

  beforeEach(() => {
    manager = new NavigationStateManager();
  });

  it('should start in idle state', () => {
    const state = manager.getState();
    expect(state.status).toBe('idle');
    expect(state.routeCoordinates).toHaveLength(0);
  });

  it('should start navigation with route', () => {
    const route: [number, number][] = [
      [151.112, -33.7737],
      [151.113, -33.7737],
    ];

    manager.startNavigation(route, [], 100);

    const state = manager.getState();
    expect(state.status).toBe('navigating');
    expect(state.totalDistance).toBe(100);
    expect(state.routeCoordinates).toHaveLength(2);
  });

  it('should stop navigation', () => {
    const route: [number, number][] = [
      [151.112, -33.7737],
      [151.113, -33.7737],
    ];

    manager.startNavigation(route, [], 100);
    manager.stopNavigation();

    const state = manager.getState();
    expect(state.status).toBe('idle');
  });

  it('should avoid false off-route state when GPS accuracy is poor', () => {
    const route: [number, number][] = [
      [151.112, -33.7737],
      [151.113, -33.7737],
    ];

    manager.startNavigation(route, [], 100);

    // ~33m north of the route but with poor GPS accuracy.
    manager.updatePosition({
      lat: -33.7734,
      lng: 151.1125,
      accuracy: 55,
      heading: null,
      speed: 1.3,
      timestamp: 1000,
    });

    const lowAccuracyState = manager.getState();
    expect(lowAccuracyState.isOffRoute).toBe(false);
    expect(lowAccuracyState.status).toBe('navigating');

    // Same location with high accuracy should now be flagged off-route.
    manager.updatePosition({
      lat: -33.7734,
      lng: 151.1125,
      accuracy: 5,
      heading: null,
      speed: 1.3,
      timestamp: 2000,
    });

    const highAccuracyState = manager.getState();
    expect(highAccuracyState.isOffRoute).toBe(true);
    expect(['off-route', 'recalculating']).toContain(highAccuracyState.status);
  });
});

describe('generateNavigationText', () => {
  it('should generate turn instruction text', () => {
    const instruction = {
      type: 'left' as const,
      text: 'Turn left',
      distance: 50,
      duration: 30,
      coordinates: [151.1125, -33.7737] as [number, number],
      streetName: 'Main Street',
    };

    const text = generateNavigationText(instruction, 100, true);
    expect(text).toContain('left');
    expect(text).toContain('Main Street');
  });

  it('should generate arrival text', () => {
    const instruction = {
      type: 'destination' as const,
      text: 'Arrive at destination',
      distance: 10,
      duration: 5,
      coordinates: [151.1125, -33.7737] as [number, number],
    };

    const text = generateNavigationText(instruction, 10, false);
    expect(text.toLowerCase()).toContain('arrived');
  });
});

describe('formatETA', () => {
  it('should format short ETA', () => {
    const eta = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const formatted = formatETA(eta);
    expect(formatted).toContain('5');
    expect(formatted).toContain('min');
  });

  it('should format long ETA', () => {
    const eta = new Date(Date.now() + 90 * 60 * 1000); // 90 minutes from now
    const formatted = formatETA(eta);
    expect(formatted).toContain('1');
    expect(formatted).toContain('h');
  });

  it('should show arriving now for immediate arrival', () => {
    const eta = new Date(Date.now() - 1000); // In the past
    const formatted = formatETA(eta);
    expect(formatted.toLowerCase()).toContain('arriving');
  });
});
