/**
 * Verify Navigation System Logic
 * Simulates a user walking along a route to ensure state updates correctly.
 * Run with: npx tsx scripts/verify-navigation.ts
 */

import { NavigationStateManager, RouteInstruction } from '../lib/map/realtimeNavigation';

async function verifyNavigation() {
  console.log('🚀 Starting Navigation System Verification...\n');

  // 1. Initialize Manager
  const navManager = new NavigationStateManager();
  console.log('✅ NavigationStateManager initialized');

  // 2. Define a Mock Route (GPS coordinates)
  // Simple straight line: Point A -> Point B (approx 100m East)
  const startGps = { lat: -33.775, lng: 151.113 };
  const endGps = { lat: -33.775, lng: 151.114 }; // ~92m East

  const routeCoords: [number, number][] = [
    [startGps.lng, startGps.lat],
    [endGps.lng, endGps.lat],
  ];

  const mockInstructions: RouteInstruction[] = [
    {
      type: 'start',
      text: 'Start walking East',
      distance: 0,
      duration: 0,
      coordinates: [startGps.lng, startGps.lat],
    },
    {
      type: 'destination',
      text: 'Arrive at destination',
      distance: 92,
      duration: 60,
      coordinates: [endGps.lng, endGps.lat],
    },
  ];

  // 3. Start Navigation
  navManager.startNavigation(routeCoords, mockInstructions, 92);
  console.log('✅ Navigation started');

  let state = navManager.getState();
  if (state.status !== 'navigating') {
    console.error('❌ Status failed to set to "navigating"');
    process.exit(1);
  }

  // 4. Simulate Movement (Walking along the line)
  console.log('\n🚶 Simulating movement...');

  // Set motion state to TRUE (Moving) so Kalman filter doesn't lock position
  navManager.setMotionState(true);

  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    // Linear interpolation between start and end
    const currentLat = startGps.lat;
    const currentLng = startGps.lng + (endGps.lng - startGps.lng) * progress;

    // Simulate GPS update
    const smoothed = navManager.updatePosition({
      lat: currentLat,
      lng: currentLng,
      accuracy: 5, // 5m accuracy
      heading: 90, // East
      speed: 1.4, // Walking speed
      timestamp: Date.now() + i * 1000,
    });

    state = navManager.getState();

    console.log(`   Step ${i}/${steps}: Progress ${(progress * 100).toFixed(0)}%`);
    console.log(`     - Dist remaining: ${state.remainingDistance.toFixed(1)}m`);
    console.log(`     - Status: ${state.status}`);

    // Check Arrival
    if (state.status === 'arrived') {
      console.log('\n🎉 ARRIVAL DETECTED!');
      break;
    }
  }

  // 5. Final Verification
  if (state.status === 'arrived') {
    console.log('\n✅ TEST PASSED: Navigation logic correctly tracked user to destination.');
  } else {
    console.error(
      `\n❌ TEST FAILED: User reached destination coords but status is "${state.status}" (expected "arrived")`,
    );
    // Note: It might fail if ARRIVAL_THRESHOLD (10m) isn't met exactly, but our loop goes to 100%.
  }
}

verifyNavigation();
