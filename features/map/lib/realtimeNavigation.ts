/**
 * realtimeNavigation.ts - Real-time Navigation Engine
 *
 * Advanced navigation utilities for:
 * - GPS position smoothing using Kalman filter
 * - Real-time route tracking and recalculation
 * - Turn-by-turn navigation instructions
 * - Off-route detection and rerouting
 * - ETA calculation with dynamic updates
 *
 * @author Syllabus Sync Team
 * @version 1.0.0
 */

import { calculateDistance, formatDistance } from "./navigationHelpers";
import {
  hapticForTurn,
  hapticForArrival,
  hapticForOffRoute,
  hapticForRecalculating,
  hapticForWaypoint,
} from "@/lib/utils/haptics";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface SmoothedPosition extends GpsPosition {
  /** Kalman-filtered latitude */
  smoothedLat: number;
  /** Kalman-filtered longitude */
  smoothedLng: number;
  /** Estimated velocity in m/s */
  velocityX: number;
  velocityY: number;
  /** Confidence score 0-1 */
  confidence: number;
}

export interface RouteInstruction {
  type:
    | "start"
    | "straight"
    | "left"
    | "right"
    | "slight-left"
    | "slight-right"
    | "u-turn"
    | "destination";
  text: string;
  distance: number; // meters to this instruction
  duration: number; // seconds to this instruction
  coordinates: [number, number]; // [lng, lat]
  streetName?: string;
}

export interface NavigationState {
  /** Current route polyline coordinates [lng, lat][] */
  routeCoordinates: [number, number][];
  /** Turn-by-turn instructions */
  instructions: RouteInstruction[];
  /** Current instruction index */
  currentInstructionIndex: number;
  /** Distance to the NEXT instruction (turn) in meters */
  distanceToNextInstruction: number;
  /** Total route distance in meters */
  totalDistance: number;
  /** Remaining distance in meters */
  remainingDistance: number;
  /** Estimated time of arrival */
  eta: Date;
  /** Whether user is off-route */
  isOffRoute: boolean;
  /** Distance from route in meters */
  distanceFromRoute: number;
  /** Navigation status */
  status: "idle" | "navigating" | "arrived" | "off-route" | "recalculating";
}

// ============================================
// CONSTANTS
// ============================================

/** Distance threshold to consider user off-route (meters) */
export const OFF_ROUTE_THRESHOLD = 25;

/** Distance to advance to next instruction (meters) */
export const INSTRUCTION_ADVANCE_THRESHOLD = 15;

/** Minimum distance change to trigger route recalculation (meters) */
export const RECALCULATION_THRESHOLD = 50;

/** Arrival threshold (meters) */
export const ARRIVAL_THRESHOLD = 10;

/** Kalman filter process noise */
const KALMAN_Q = 2; // Process noise (m²) - tuned for smoother campus walking

/** Kalman filter measurement noise base */
const KALMAN_R_BASE = 10; // Base measurement noise (m²)

/** Maximum position history for smoothing */
const MAX_POSITION_HISTORY = 10;

/** Walking speed bounds for validation (m/s) */
const MIN_WALKING_SPEED = 0.3; // ~1 km/h (very slow walk)
const MAX_WALKING_SPEED = 3.0; // ~11 km/h (running)

// ============================================
// KALMAN FILTER FOR GPS SMOOTHING
// ============================================

interface KalmanState {
  x: number; // Position estimate
  v: number; // Velocity estimate
  p: number; // Position variance
  pv: number; // Velocity variance
}

/**
 * 1D Kalman filter for GPS coordinate smoothing
 * Handles noisy GPS signals and produces smoother position estimates
 */
class KalmanFilter1D {
  private state: KalmanState;
  private lastTimestamp: number = 0;
  private initialized: boolean = false;

  constructor(initialPosition: number = 0) {
    this.state = {
      x: initialPosition,
      v: 0,
      p: 1000, // High initial uncertainty
      pv: 1000,
    };
    if (initialPosition !== 0) this.initialized = true;
  }

  /**
   * Update filter with new measurement
   */
  update(
    measurement: number,
    accuracy: number,
    timestamp: number,
    qMultiplier: number = 1.0,
  ): { position: number; velocity: number } {
    if (!this.initialized) {
      this.state.x = measurement;
      this.state.v = 0;
      this.state.p = accuracy * accuracy; // Trust the first measurement's accuracy
      this.lastTimestamp = timestamp;
      this.initialized = true;
      return { position: this.state.x, velocity: 0 };
    }

    const dt =
      this.lastTimestamp > 0 ? (timestamp - this.lastTimestamp) / 1000 : 0.1;
    this.lastTimestamp = timestamp;

    // Clamp dt to reasonable bounds
    const clampedDt = Math.max(0.01, Math.min(dt, 5));

    // Dynamic Process Noise
    const Q = KALMAN_Q * qMultiplier * clampedDt;

    // Predict step
    const predictedX = this.state.x + this.state.v * clampedDt;
    const predictedP = this.state.p + this.state.pv * clampedDt * clampedDt + Q;

    // Measurement noise
    const stationaryPenalty = qMultiplier < 0.1 ? 5.0 : 1.0;
    const R =
      (KALMAN_R_BASE + accuracy * accuracy * 0.0001) * stationaryPenalty;

    // Update step
    const K = predictedP / (predictedP + R);

    // Update state
    const innovation = measurement - predictedX;
    this.state.x = predictedX + K * innovation;
    this.state.v = this.state.v + (K * innovation) / clampedDt;
    this.state.p = (1 - K) * predictedP;
    this.state.pv = this.state.pv * 0.99;

    const maxVelocityDegrees = MAX_WALKING_SPEED / 111000;
    this.state.v = Math.max(
      -maxVelocityDegrees,
      Math.min(maxVelocityDegrees, this.state.v),
    );

    return {
      position: this.state.x,
      velocity: this.state.v,
    };
  }

  /** Reset filter with new initial position */
  reset(initialPosition: number): void {
    this.state = {
      x: initialPosition,
      v: 0,
      p: 1000,
      pv: 1000,
    };
    this.lastTimestamp = 0;
    this.initialized = initialPosition !== 0;
  }

  /** Get current confidence (inverse of variance, normalized) */
  getConfidence(): number {
    return Math.min(1, 1 / (1 + this.state.p));
  }
}

/**
 * GPS Position Smoother using dual Kalman filters
 * Provides smoothed coordinates with velocity estimation
 */
export class GpsPositionSmoother {
  private latFilter: KalmanFilter1D;
  private lngFilter: KalmanFilter1D;
  private positionHistory: GpsPosition[] = [];
  private isMoving: boolean = true; // Default to moving if no sensor data

  constructor() {
    this.latFilter = new KalmanFilter1D();
    this.lngFilter = new KalmanFilter1D();
  }

  /**
   * Update motion state from sensors (pedometer/accelerometer)
   * @param isMoving - true if user is physically moving
   */
  setMotionState(isMoving: boolean) {
    this.isMoving = isMoving;
  }

  /**
   * Process new GPS position and return smoothed result
   */
  update(position: GpsPosition): SmoothedPosition {
    // Add to history
    this.positionHistory.push(position);
    if (this.positionHistory.length > MAX_POSITION_HISTORY) {
      this.positionHistory.shift();
    }

    // Apply Kalman filter with motion-aware tuning
    // If stationary, we trust the model (velocity=0) heavily and reject measurement noise
    const qMultiplier = this.isMoving ? 1.0 : 0.01;

    const latResult = this.latFilter.update(
      position.lat,
      position.accuracy,
      position.timestamp,
      qMultiplier,
    );
    const lngResult = this.lngFilter.update(
      position.lng,
      position.accuracy,
      position.timestamp,
      qMultiplier,
    );

    // Calculate confidence based on accuracy and filter state
    const accuracyConfidence = Math.max(0, 1 - position.accuracy / 100);
    const filterConfidence =
      (this.latFilter.getConfidence() + this.lngFilter.getConfidence()) / 2;
    const confidence = accuracyConfidence * 0.4 + filterConfidence * 0.6;

    // Convert velocity from degrees/s to m/s (approximate)
    const velocityX =
      lngResult.velocity * 111000 * Math.cos((position.lat * Math.PI) / 180);
    const velocityY = latResult.velocity * 111000;

    return {
      ...position,
      smoothedLat: latResult.position,
      smoothedLng: lngResult.position,
      velocityX,
      velocityY,
      confidence,
    };
  }

  /** Reset smoother state */
  reset(): void {
    this.positionHistory = [];
    this.latFilter = new KalmanFilter1D();
    this.lngFilter = new KalmanFilter1D();
  }

  /** Get recent position history */
  getHistory(): GpsPosition[] {
    return [...this.positionHistory];
  }

  /**
   * Calculate heading from recent positions
   * More reliable than device heading for slow movement
   */
  calculateMovementHeading(): number | null {
    if (this.positionHistory.length < 2) return null;

    const recent = this.positionHistory.slice(-3);
    if (recent.length < 2) return null;

    const first = recent[0];
    const last = recent[recent.length - 1];

    // Calculate bearing
    const dLng = ((last.lng - first.lng) * Math.PI) / 180;
    const lat1 = (first.lat * Math.PI) / 180;
    const lat2 = (last.lat * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let heading = (Math.atan2(y, x) * 180) / Math.PI;
    heading = (heading + 360) % 360;

    // Check if movement is significant enough
    const distance = calculateDistance(
      { lat: first.lat, lng: first.lng },
      { lat: last.lat, lng: last.lng },
    );

    // Only return heading if moved at least 2 meters
    return distance >= 2 ? heading : null;
  }

  /**
   * Calculate current speed from recent positions
   */
  calculateSpeed(): number {
    if (this.positionHistory.length < 2) return 0;

    const recent = this.positionHistory.slice(-3);
    if (recent.length < 2) return 0;

    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];

      totalDistance += calculateDistance(
        { lat: prev.lat, lng: prev.lng },
        { lat: curr.lat, lng: curr.lng },
      );
      totalTime += (curr.timestamp - prev.timestamp) / 1000;
    }

    if (totalTime <= 0) return 0;

    const speed = totalDistance / totalTime;

    // Validate speed is within walking bounds
    if (speed < MIN_WALKING_SPEED || speed > MAX_WALKING_SPEED) {
      return 0;
    }

    return speed;
  }
}

// ============================================
// ROUTE TRACKING & NAVIGATION
// ============================================

/**
 * Find the closest point on a route polyline to the user's position
 */
export function findClosestPointOnRoute(
  userLat: number,
  userLng: number,
  routeCoordinates: [number, number][],
): {
  closestPoint: [number, number];
  distance: number;
  segmentIndex: number;
  progressAlongSegment: number;
} {
  let minDistance = Infinity;
  let closestPoint: [number, number] = routeCoordinates[0];
  let segmentIndex = 0;
  let progressAlongSegment = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const [lng1, lat1] = routeCoordinates[i];
    const [lng2, lat2] = routeCoordinates[i + 1];

    // Find closest point on segment
    const result = closestPointOnSegment(
      userLat,
      userLng,
      lat1,
      lng1,
      lat2,
      lng2,
    );

    if (result.distance < minDistance) {
      minDistance = result.distance;
      closestPoint = [result.lng, result.lat];
      segmentIndex = i;
      progressAlongSegment = result.t;
    }
  }

  return {
    closestPoint,
    distance: minDistance,
    segmentIndex,
    progressAlongSegment,
  };
}

/**
 * Find closest point on a line segment
 */
function closestPointOnSegment(
  px: number,
  py: number, // Point (lat, lng)
  x1: number,
  y1: number, // Segment start (lat, lng)
  x2: number,
  y2: number, // Segment end (lat, lng)
): { lat: number; lng: number; distance: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  let t = 0;
  if (lengthSq > 0) {
    t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  }

  const closestLat = x1 + t * dx;
  const closestLng = y1 + t * dy;
  const distance = calculateDistance(
    { lat: px, lng: py },
    { lat: closestLat, lng: closestLng },
  );

  return { lat: closestLat, lng: closestLng, distance, t };
}

/**
 * Calculate remaining distance along route from current position
 */
export function calculateRemainingDistance(
  routeCoordinates: [number, number][],
  currentSegmentIndex: number,
  progressAlongSegment: number,
): number {
  if (routeCoordinates.length < 2) return 0;

  let remaining = 0;

  // Distance from current point to end of current segment
  const [lng1, lat1] = routeCoordinates[currentSegmentIndex];
  const [lng2, lat2] =
    routeCoordinates[currentSegmentIndex + 1] ||
    routeCoordinates[currentSegmentIndex];

  const segmentLength = calculateDistance(
    { lat: lat1, lng: lng1 },
    { lat: lat2, lng: lng2 },
  );
  remaining += segmentLength * (1 - progressAlongSegment);

  // Add remaining segments
  for (let i = currentSegmentIndex + 1; i < routeCoordinates.length - 1; i++) {
    const [sLng1, sLat1] = routeCoordinates[i];
    const [sLng2, sLat2] = routeCoordinates[i + 1];
    remaining += calculateDistance(
      { lat: sLat1, lng: sLng1 },
      { lat: sLat2, lng: sLng2 },
    );
  }

  return remaining;
}

/**
 * Parse ORS route response into navigation instructions
 */
export function parseRouteInstructions(orsResponse: {
  features?: Array<{
    properties?: {
      segments?: Array<{
        steps?: Array<{
          type: number;
          instruction: string;
          distance: number;
          duration: number;
          way_points: number[];
          name?: string;
        }>;
      }>;
    };
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}): RouteInstruction[] {
  const instructions: RouteInstruction[] = [];

  const feature = orsResponse.features?.[0];
  if (!feature) return instructions;

  const coordinates = feature.geometry?.coordinates || [];
  const segments = feature.properties?.segments || [];

  for (const segment of segments) {
    for (const step of segment.steps || []) {
      const waypointIndex = step.way_points[0];
      const coord = coordinates[waypointIndex] || [0, 0];

      instructions.push({
        type: mapOrsTypeToInstructionType(step.type),
        text: step.instruction,
        distance: step.distance,
        duration: step.duration,
        coordinates: coord,
        streetName: step.name,
      });
    }
  }

  return instructions;
}

/**
 * Map ORS step type to our instruction type
 */
function mapOrsTypeToInstructionType(
  orsType: number,
): RouteInstruction["type"] {
  // ORS step types: https://giscience.github.io/openrouteservice/documentation/Instruction-Types.html
  switch (orsType) {
    case 0:
      return "left";
    case 1:
      return "right";
    case 2:
      return "slight-left";
    case 3:
      return "slight-right";
    case 4:
      return "straight";
    case 5:
      return "u-turn";
    case 6:
      return "u-turn";
    case 10:
      return "destination";
    case 11:
      return "start";
    case 12:
      return "start";
    default:
      return "straight";
  }
}

/**
 * Get current navigation instruction based on position
 */
export function getCurrentInstruction(
  instructions: RouteInstruction[],
  userLat: number,
  userLng: number,
  currentIndex: number,
): {
  instruction: RouteInstruction;
  index: number;
  distanceToNext: number;
} | null {
  if (instructions.length === 0) return null;

  // Find current instruction by checking distance to instruction points
  let bestIndex = currentIndex;
  let bestDistance = Infinity;

  for (let i = currentIndex; i < instructions.length; i++) {
    const inst = instructions[i];
    const distance = calculateDistance(
      { lat: userLat, lng: userLng },
      { lat: inst.coordinates[1], lng: inst.coordinates[0] },
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }

    // If we're past an instruction by threshold, advance
    if (
      i === currentIndex &&
      distance < INSTRUCTION_ADVANCE_THRESHOLD &&
      i < instructions.length - 1
    ) {
      bestIndex = i + 1;
      break;
    }
  }

  return {
    instruction: instructions[bestIndex],
    index: bestIndex,
    distanceToNext: bestDistance,
  };
}

/**
 * Generate voice-friendly navigation text
 */
export function generateNavigationText(
  instruction: RouteInstruction,
  distanceToInstruction: number,
  isUpcoming: boolean = false,
): string {
  const distanceText = formatDistance(distanceToInstruction);

  if (isUpcoming && distanceToInstruction > 20) {
    // Upcoming instruction
    switch (instruction.type) {
      case "left":
        return `In ${distanceText}, turn left${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "right":
        return `In ${distanceText}, turn right${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "slight-left":
        return `In ${distanceText}, bear left${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "slight-right":
        return `In ${distanceText}, bear right${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "u-turn":
        return `In ${distanceText}, make a U-turn`;
      case "destination":
        return `Your destination is ${distanceText} ahead`;
      default:
        return `Continue for ${distanceText}`;
    }
  } else {
    // Immediate instruction
    switch (instruction.type) {
      case "start":
        return `Head ${instruction.streetName ? `toward ${instruction.streetName}` : "to the route"}`;
      case "left":
        return `Turn left${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "right":
        return `Turn right${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "slight-left":
        return `Bear left${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "slight-right":
        return `Bear right${instruction.streetName ? ` onto ${instruction.streetName}` : ""}`;
      case "u-turn":
        return "Make a U-turn";
      case "destination":
        return "You have arrived at your destination";
      default:
        return "Continue straight";
    }
  }
}

/**
 * Calculate ETA based on remaining distance and current speed
 */
export function calculateETA(
  remainingDistance: number,
  currentSpeed: number,
): Date {
  // Use current speed if valid, otherwise use average walking speed
  const effectiveSpeed = currentSpeed > MIN_WALKING_SPEED ? currentSpeed : 1.4; // 5 km/h default
  const remainingSeconds = remainingDistance / effectiveSpeed;

  return new Date(Date.now() + remainingSeconds * 1000);
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date): string {
  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins <= 0) {
    return "Arriving now";
  } else if (diffMins < 60) {
    return `${diffMins} min`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

// ============================================
// NAVIGATION STATE MANAGER
// ============================================

export class NavigationStateManager {
  private state: NavigationState;
  private positionSmoother: GpsPositionSmoother;
  private onStateChange?: (state: NavigationState) => void;
  private onOffRoute?: () => void;
  private lastRecalculationPosition: { lat: number; lng: number } | null = null;

  constructor() {
    this.state = this.getInitialState();
    this.positionSmoother = new GpsPositionSmoother();
  }

  private getInitialState(): NavigationState {
    return {
      routeCoordinates: [],
      instructions: [],
      currentInstructionIndex: 0,
      distanceToNextInstruction: 0,
      totalDistance: 0,
      remainingDistance: 0,
      eta: new Date(),
      isOffRoute: false,
      distanceFromRoute: 0,
      status: "idle",
    };
  }

  /** Set callback for state changes */
  setOnStateChange(callback: (state: NavigationState) => void): void {
    this.onStateChange = callback;
  }

  /** Set callback for off-route detection */
  setOnOffRoute(callback: () => void): void {
    this.onOffRoute = callback;
  }

  /** Update motion state (for smoothing) */
  setMotionState(isMoving: boolean): void {
    this.positionSmoother.setMotionState(isMoving);
  }

  /** Start navigation with a route */
  startNavigation(
    routeCoordinates: [number, number][],
    instructions: RouteInstruction[],
    totalDistance: number,
  ): void {
    this.state = {
      routeCoordinates,
      instructions,
      currentInstructionIndex: 0,
      distanceToNextInstruction: 0,
      totalDistance,
      remainingDistance: totalDistance,
      eta: calculateETA(totalDistance, 1.4),
      isOffRoute: false,
      distanceFromRoute: 0,
      status: "navigating",
    };
    this.positionSmoother.reset();
    this.lastRecalculationPosition = null;
    this.notifyStateChange();
  }

  /** Update with new GPS position */
  updatePosition(position: GpsPosition): SmoothedPosition {
    const smoothed = this.positionSmoother.update(position);

    if (
      this.state.status === "navigating" &&
      this.state.routeCoordinates.length > 0
    ) {
      this.updateNavigationState(smoothed);
    }

    return smoothed;
  }

  private updateNavigationState(position: SmoothedPosition): void {
    const { routeCoordinates, instructions } = this.state;

    // Find closest point on route
    const closest = findClosestPointOnRoute(
      position.smoothedLat,
      position.smoothedLng,
      routeCoordinates,
    );

    this.state.distanceFromRoute = closest.distance;

    // Check if off-route
    const wasOffRoute = this.state.isOffRoute;
    this.state.isOffRoute = closest.distance > OFF_ROUTE_THRESHOLD;

    if (this.state.isOffRoute && !wasOffRoute) {
      this.state.status = "off-route";
      // Haptic feedback for off-route warning
      hapticForOffRoute();
      this.onOffRoute?.();
    } else if (!this.state.isOffRoute && wasOffRoute) {
      this.state.status = "navigating";
    }

    // Calculate remaining distance
    this.state.remainingDistance = calculateRemainingDistance(
      routeCoordinates,
      closest.segmentIndex,
      closest.progressAlongSegment,
    );

    // Check for arrival
    if (this.state.remainingDistance < ARRIVAL_THRESHOLD) {
      this.state.status = "arrived";
      // Haptic feedback for arrival
      hapticForArrival();
      this.notifyStateChange();
      return;
    }

    // Update current instruction
    const previousInstructionIndex = this.state.currentInstructionIndex;
    const currentInst = getCurrentInstruction(
      instructions,
      position.smoothedLat,
      position.smoothedLng,
      this.state.currentInstructionIndex,
    );

    if (currentInst) {
      this.state.currentInstructionIndex = currentInst.index;
      this.state.distanceToNextInstruction = currentInst.distanceToNext;

      // Trigger haptic feedback when advancing to a new instruction (turn)
      if (currentInst.index > previousInstructionIndex) {
        const instruction = instructions[currentInst.index];
        if (instruction) {
          // Trigger turn-specific haptic pattern
          hapticForTurn(
            instruction.type as Parameters<typeof hapticForTurn>[0],
          );
        }
      }

      // Trigger waypoint haptic when close to next instruction
      if (
        currentInst.distanceToNext <= INSTRUCTION_ADVANCE_THRESHOLD &&
        currentInst.distanceToNext > 5
      ) {
        hapticForWaypoint();
      }
    }

    // Update ETA
    const speed = this.positionSmoother.calculateSpeed();
    this.state.eta = calculateETA(this.state.remainingDistance, speed);

    // Check if we should trigger recalculation
    if (this.shouldRecalculate(position)) {
      this.state.status = "recalculating";
      // Haptic feedback for recalculation
      hapticForRecalculating();
    }

    this.notifyStateChange();
  }

  private shouldRecalculate(position: SmoothedPosition): boolean {
    // Don't recalculate if not off-route significantly
    if (this.state.distanceFromRoute < RECALCULATION_THRESHOLD) {
      return false;
    }

    // Check if we've moved significantly since last recalculation
    if (this.lastRecalculationPosition) {
      const distanceSinceRecalc = calculateDistance(
        { lat: position.smoothedLat, lng: position.smoothedLng },
        this.lastRecalculationPosition,
      );
      if (distanceSinceRecalc < RECALCULATION_THRESHOLD) {
        return false;
      }
    }

    this.lastRecalculationPosition = {
      lat: position.smoothedLat,
      lng: position.smoothedLng,
    };

    return true;
  }

  /** Get current navigation state */
  getState(): NavigationState {
    return { ...this.state };
  }

  /** Get current instruction with distance */
  getCurrentInstruction(): {
    instruction: RouteInstruction;
    distanceToNext: number;
  } | null {
    const { instructions, currentInstructionIndex } = this.state;
    if (instructions.length === 0) return null;

    const instruction = instructions[currentInstructionIndex];
    if (!instruction) return null;

    return {
      instruction,
      distanceToNext: this.state.distanceToNextInstruction,
    };
  }

  /** Get next instruction preview */
  getNextInstruction(): RouteInstruction | null {
    const nextIndex = this.state.currentInstructionIndex + 1;
    return this.state.instructions[nextIndex] || null;
  }

  /** Get position smoother for external use */
  getPositionSmoother(): GpsPositionSmoother {
    return this.positionSmoother;
  }

  /** Stop navigation */
  stopNavigation(): void {
    this.state = this.getInitialState();
    this.positionSmoother.reset();
    this.lastRecalculationPosition = null;
    this.notifyStateChange();
  }

  /** Notify listeners of state change */
  private notifyStateChange(): void {
    this.onStateChange?.(this.getState());
  }
}
