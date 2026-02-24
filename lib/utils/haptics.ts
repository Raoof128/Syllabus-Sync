/**
 * haptics.ts - Haptic Feedback Utility for Mobile Navigation
 *
 * Provides haptic feedback (vibration) for mobile devices during navigation.
 * Uses the Vibration API with fallbacks for different devices and browsers.
 *
 * Haptic patterns:
 * - Light tap: Quick confirmation (waypoint reached)
 * - Medium pulse: Turn instruction
 * - Strong pulse: Important action (off-route, arrival)
 * - Pattern: Complex sequence for specific events
 *
 * @author Syllabus Sync Team
 * @version 1.0.0
 */

// ============================================
// TYPES
// ============================================

export type HapticIntensity = 'light' | 'medium' | 'strong';

export type HapticPattern =
  | 'tap' // Quick single tap
  | 'doubleTap' // Two quick taps
  | 'turnLeft' // Pattern for left turn
  | 'turnRight' // Pattern for right turn
  | 'arrival' // Arrival celebration
  | 'offRoute' // Warning for off-route
  | 'recalculating' // Route recalculation
  | 'error'; // Error notification

// Vibration pattern type: [vibrate, pause, vibrate, pause, ...]
type VibrationPattern = number | number[];

// ============================================
// CONSTANTS
// ============================================

/** Haptic patterns in milliseconds [vibrate, pause, vibrate, ...] */
const HAPTIC_PATTERNS: Record<HapticPattern, VibrationPattern> = {
  tap: 10, // Quick 10ms tap
  doubleTap: [10, 50, 10], // Two quick taps
  turnLeft: [50, 30, 100], // Short-long pattern (feels like "dit-dah")
  turnRight: [100, 30, 50], // Long-short pattern (feels like "dah-dit")
  arrival: [50, 50, 50, 50, 200], // Celebratory pattern
  offRoute: [100, 100, 100, 100, 100], // Warning pulses
  recalculating: [30, 50, 30, 50, 30], // Thinking pattern
  error: [200, 100, 200], // Strong warning
};

/** Intensity multipliers for vibration duration */
const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  light: 0.5,
  medium: 1.0,
  strong: 1.5,
};

/** Minimum time between haptic events to prevent spam (ms) */
const HAPTIC_DEBOUNCE_MS = 300;

/** Check if we're in a browser environment */
const isBrowser = typeof window !== 'undefined';

// ============================================
// STATE
// ============================================

let lastHapticTime = 0;
let hapticEnabled = true;

// Callback to sync with external store (e.g., Zustand)
let externalEnabledGetter: (() => boolean) | null = null;

/**
 * Set an external getter for haptic enabled state
 * This allows syncing with Zustand or other state management
 */
export function setHapticEnabledGetter(getter: () => boolean): void {
  externalEnabledGetter = getter;
}

/**
 * Get the effective enabled state (checks external getter first)
 */
function getEffectiveEnabled(): boolean {
  if (externalEnabledGetter) {
    return externalEnabledGetter();
  }
  return hapticEnabled;
}

// ============================================
// CAPABILITY DETECTION
// ============================================

/**
 * Check if the Vibration API is supported
 */
export function isHapticSupported(): boolean {
  if (!isBrowser) return false;
  return 'vibrate' in navigator;
}

/**
 * Check if we're on a mobile device (where haptics make sense)
 */
export function isMobileDevice(): boolean {
  if (!isBrowser) return false;

  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check user agent for mobile indicators
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  return hasTouch && mobileUA;
}

/**
 * Check if haptics should be triggered (supported + enabled + on mobile)
 */
export function shouldTriggerHaptics(): boolean {
  return isHapticSupported() && getEffectiveEnabled() && isMobileDevice();
}

// ============================================
// HAPTIC CONTROL
// ============================================

/**
 * Enable or disable haptic feedback globally
 */
export function setHapticEnabled(enabled: boolean): void {
  hapticEnabled = enabled;

  // Store preference
  if (isBrowser) {
    try {
      localStorage.setItem('hapticFeedbackEnabled', JSON.stringify(enabled));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Get current haptic enabled state
 */
export function isHapticEnabled(): boolean {
  return hapticEnabled;
}

/**
 * Initialize haptic settings from stored preferences
 */
export function initHapticPreferences(): void {
  if (!isBrowser) return;

  try {
    const stored = localStorage.getItem('hapticFeedbackEnabled');
    if (stored !== null) {
      hapticEnabled = JSON.parse(stored);
    }
  } catch {
    // Use default (enabled)
  }
}

// ============================================
// CORE HAPTIC FUNCTIONS
// ============================================

/**
 * Trigger a haptic vibration pattern
 * @param pattern - The pattern to vibrate
 * @param intensity - Intensity level (affects duration)
 * @returns true if haptic was triggered, false otherwise
 */
export function triggerHaptic(
  pattern: HapticPattern,
  intensity: HapticIntensity = 'medium',
): boolean {
  // Check if we should trigger
  if (!shouldTriggerHaptics()) {
    return false;
  }

  // Debounce rapid haptic requests
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_DEBOUNCE_MS) {
    return false;
  }
  lastHapticTime = now;

  // Get the pattern
  const basePattern = HAPTIC_PATTERNS[pattern];
  const multiplier = INTENSITY_MULTIPLIERS[intensity];

  // Apply intensity multiplier
  const adjustedPattern = applyIntensity(basePattern, multiplier);

  // Trigger vibration
  try {
    navigator.vibrate(adjustedPattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply intensity multiplier to a vibration pattern
 */
function applyIntensity(pattern: VibrationPattern, multiplier: number): VibrationPattern {
  if (typeof pattern === 'number') {
    return Math.round(pattern * multiplier);
  }

  return pattern.map((duration, index) => {
    // Only multiply vibration durations (even indices), not pauses
    if (index % 2 === 0) {
      return Math.round(duration * multiplier);
    }
    return duration;
  });
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (!isBrowser || !isHapticSupported()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // Ignore errors
  }
}

// ============================================
// NAVIGATION-SPECIFIC HAPTICS
// ============================================

/**
 * Trigger haptic for a navigation turn instruction
 * @param turnType - Type of turn
 */
export function hapticForTurn(
  turnType: 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn' | 'straight',
): boolean {
  switch (turnType) {
    case 'left':
    case 'slight-left':
      return triggerHaptic('turnLeft', 'medium');
    case 'right':
    case 'slight-right':
      return triggerHaptic('turnRight', 'medium');
    case 'u-turn':
      return triggerHaptic('turnLeft', 'strong'); // Strong left for U-turn
    case 'straight':
      return triggerHaptic('tap', 'light'); // Light tap for straight
    default:
      return false;
  }
}

/**
 * Trigger haptic for navigation arrival
 */
export function hapticForArrival(): boolean {
  return triggerHaptic('arrival', 'strong');
}

/**
 * Trigger haptic for off-route warning
 */
export function hapticForOffRoute(): boolean {
  return triggerHaptic('offRoute', 'strong');
}

/**
 * Trigger haptic for route recalculation
 */
export function hapticForRecalculating(): boolean {
  return triggerHaptic('recalculating', 'light');
}

/**
 * Trigger haptic for waypoint reached
 */
export function hapticForWaypoint(): boolean {
  return triggerHaptic('doubleTap', 'medium');
}

/**
 * Trigger haptic for error
 */
export function hapticForError(): boolean {
  return triggerHaptic('error', 'strong');
}

// ============================================
// INITIALIZATION
// ============================================

// Auto-initialize preferences on module load
if (isBrowser) {
  initHapticPreferences();
}
