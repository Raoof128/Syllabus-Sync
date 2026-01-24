/**
 * Full Navigation Suite Verification
 * Comprehensive simulation of the entire navigation engine.
 *
 * Scenarios:
 * 1. Normal Navigation with Turns
 * 2. Instruction Updates (Voice/Text)
 * 3. Dynamic ETA (Walking vs Stopped)
 * 4. Off-Route & Recovery
 * 5. Arrival
 *
 * Run with: npx tsx scripts/verify-full-navigation-suite.ts
 */

import {
  NavigationStateManager,
  RouteInstruction,
  generateNavigationText,
  formatETA,
} from '../lib/map/realtimeNavigation';

// === MOCK DATA ===

// A simple "Z" shaped route:
// A (0,0) -> East 100m -> B (0, 100) -> North 50m -> C (50, 100) -> East 50m -> D (50, 150)
const START_LAT = -33.775;
const START_LNG = 151.113;

const A = { lat: START_LAT, lng: START_LNG };
const B = { lat: START_LAT, lng: START_LNG + 0.00104 }; // +100m East
const C = { lat: START_LAT + 0.00045, lng: B.lng }; // +50m North
const D = { lat: C.lat, lng: C.lng + 0.00052 }; // +50m East

const ROUTE_COORDS: [number, number][] = [
  [A.lng, A.lat],
  [B.lng, B.lat],
  [C.lng, C.lat],
  [D.lng, D.lat],
];

const INSTRUCTIONS: RouteInstruction[] = [
  {
    type: 'start',
    text: 'Head East on Wallys Walk',
    distance: 0,
    duration: 0,
    coordinates: [A.lng, A.lat],
  },
  {
    type: 'left',
    text: 'Turn left onto Eastern Road',
    distance: 100,
    duration: 71,
    coordinates: [B.lng, B.lat],
    streetName: 'Eastern Road',
  },
  {
    type: 'right',
    text: 'Turn right toward Library',
    distance: 50,
    duration: 35,
    coordinates: [C.lng, C.lat],
    streetName: 'Library Path',
  },
  {
    type: 'destination',
    text: 'Arrive at Library',
    distance: 50,
    duration: 35,
    coordinates: [D.lng, D.lat],
  },
];

const TOTAL_DIST = 200; // 100 + 50 + 50

async function runFullSuite() {
  console.log('🚀 STARTING FULL NAVIGATION SUITE SIMULATION\n');

  const navManager = new NavigationStateManager();
  navManager.setMotionState(true); // Simulate walking

  navManager.startNavigation(ROUTE_COORDS, INSTRUCTIONS, TOTAL_DIST);
  let currentTime = Date.now();

  console.log('✅ Navigation Initialized');

  // --- HELPER ---
  const tick = (lat: number, lng: number, speed: number, desc: string) => {
    currentTime += 1000;
    const smoothed = navManager.updatePosition({
      lat,
      lng,
      accuracy: 5,
      heading: 0,
      speed,
      timestamp: currentTime,
    });
    const state = navManager.getState();

    // Get guidance text from the manager's current instruction state
    const currentInstDetails = navManager.getCurrentInstruction();
    const voiceText = currentInstDetails
      ? generateNavigationText(
          currentInstDetails.instruction,
          currentInstDetails.distanceToNext,
          true,
        )
      : '---';

    console.log(`\n📍 ${desc}`);
    console.log(`   Pos: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
    console.log(
      `   Status: ${state.status.toUpperCase().padEnd(10)} | ETA: ${formatETA(state.eta)}`,
    );
    console.log(`   Guidance: "${voiceText}"`);
    console.log(`   Progress: ${(1 - state.remainingDistance / TOTAL_DIST) * 100}%`);

    return state;
  };

  // 1. START - Walking A to B
  // We are at 10m from start
  const p1 = { lat: A.lat, lng: A.lng + 0.0001 }; // ~10m East
  tick(p1.lat, p1.lng, 1.4, 'Walking East (Approaching Turn)');

  // 2. APPROACHING TURN - 80m from start (20m to turn)
  const p2 = { lat: A.lat, lng: A.lng + 0.0008 }; // ~80m East
  const state2 = tick(p2.lat, p2.lng, 1.4, 'Approaching Turn (20m away)');

  if (state2.instructions[state2.currentInstructionIndex].type === 'left') {
    console.log('   ✅ Correct Instruction: System prepared for LEFT turn.');
  }

  // 3. EXECUTING TURN - At B
  tick(B.lat, B.lng, 1.4, 'At Turn Point (B)');

  // 4. AFTER TURN - Walking North (B to C)
  const p3 = { lat: B.lat + 0.0002, lng: B.lng }; // ~22m North
  tick(p3.lat, p3.lng, 1.4, 'Walking North (After Left Turn)');

  // 5. TEST DYNAMIC ETA - Stop Walking
  console.log('\n🛑 SIMULATING STOP (Checking ETA impact)...');
  navManager.setMotionState(false); // Sensor says "Stopped"
  for (let i = 0; i < 3; i++) {
    currentTime += 20000; // 20 sec jumps
    // We keep position p3 constant
    navManager.updatePosition({
      lat: p3.lat,
      lng: p3.lng,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: currentTime,
    });
    const st = navManager.getState();
    console.log(`   Stopped for ${(i + 1) * 20}s... ETA: ${formatETA(st.eta)}`);
  }
  navManager.setMotionState(true); // Start moving again

  // 6. OFF-ROUTE TEST
  console.log('\n⚠️ SIMULATING OFF-ROUTE DRIFT...');
  // Go West from current position (Off path)
  const pOff = { lat: p3.lat, lng: p3.lng - 0.0005 }; // ~50m West
  const stateOff = tick(pOff.lat, pOff.lng, 1.4, 'Drifted 50m West');

  if (stateOff.status === 'off-route' || stateOff.status === 'recalculating') {
    console.log('   ✅ Off-Route Detected!');
  } else {
    console.log(`   ❌ Failed to detect off-route (Status: ${stateOff.status})`);
  }

  // 7. RECOVERY
  console.log('\n🔄 SIMULATING RECOVERY...');
  // Teleport back to C (Turn point 2)
  tick(C.lat, C.lng, 1.4, 'Returned to Path at C');

  // 8. FINAL STRETCH - C to D
  const p4 = { lat: C.lat, lng: C.lng + 0.0004 }; // ~40m East (10m from dest)
  tick(p4.lat, p4.lng, 1.4, 'Approaching Destination');

  // 9. ARRIVAL
  tick(D.lat, D.lng, 1.4, 'At Destination (D)');
}

runFullSuite();
