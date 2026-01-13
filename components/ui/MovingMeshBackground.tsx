// components/ui/MovingMeshBackground.tsx
// ============================================================================
// MOVING MESH BACKGROUND - Parallax Blob Animation
// ============================================================================
// Creates an animated background with drifting gradient blobs that move at
// different speeds (parallax effect). Essential for making liquid glass
// refraction visible through glass panels.
//
// FEATURES:
// - MQ Red and Navy blobs with parallax movement
// - Different animation speeds for depth perception
// - Subtle rotation and scale animations
// - GPU-accelerated via transform and will-change
// - Respects prefers-reduced-motion
// - Dark mode support with 'screen' blend mode
//
// USAGE:
// Add <MovingMeshBackground /> as first child in root layout, positioned
// behind all content (z-index: -10).
//
// @version 1.1.0
// @see liquid-glass.css for mesh gradient styles
// ============================================================================
'use client';

import { memo, useSyncExternalStore, useEffect, useState } from 'react';
import { LazyMotion, m, domAnimation, useReducedMotion } from 'framer-motion';

// ============================================================================
// CLIENT-SIDE DETECTION
// ============================================================================

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// ============================================================================
// BLOB CONFIGURATIONS
// ============================================================================

interface BlobConfig {
  id: string;
  color: string;
  position: { top?: string; left?: string; right?: string; bottom?: string };
  size: { width: string; height: string };
  opacity: number;
  blur: number;
  /** Animation duration in seconds - longer = slower parallax layer */
  duration: number;
  /** Movement amplitude in pixels */
  amplitude: { x: number[]; y: number[] };
  /** Scale animation values */
  scale: number[];
  /** Rotation animation values in degrees */
  rotate: number[];
  /** Z-index for layering (negative values for background) */
  zIndex: number;
}

// MQ Brand Colors - Light Mode
const MQ_NAVY = '#002A45';
const MQ_NAVY_LIGHT = 'rgba(0, 42, 69, 0.6)';
const MQ_RED = 'rgba(166, 25, 46, 0.5)';
const MQ_RED_LIGHT = 'rgba(166, 25, 46, 0.3)';
const CHARCOAL = 'rgba(26, 26, 26, 0.25)';
const GOLD = 'rgba(212, 175, 55, 0.2)';

// MQ Brand Colors - Dark Mode (brighter for screen blend mode)
const MQ_NAVY_DARK_MODE = 'rgba(0, 61, 102, 0.4)';
const MQ_NAVY_LIGHT_DARK_MODE = 'rgba(0, 80, 130, 0.35)';
const MQ_RED_DARK_MODE = 'rgba(200, 50, 70, 0.35)';
const MQ_RED_LIGHT_DARK_MODE = 'rgba(200, 50, 70, 0.25)';
const CHARCOAL_DARK_MODE = 'rgba(80, 80, 80, 0.2)';
const GOLD_DARK_MODE = 'rgba(212, 175, 55, 0.15)';

const BLOB_CONFIGS: BlobConfig[] = [
  // ========================================
  // LAYER 1: Far background (slowest)
  // ========================================
  {
    id: 'navy-far',
    color: MQ_NAVY,
    position: { top: '-20%', left: '-15%' },
    size: { width: '60vw', height: '60vh' },
    opacity: 0.5,
    blur: 120,
    duration: 90, // Slowest - far background
    amplitude: { x: [0, 80, 30, -50, 0], y: [0, 50, -30, 60, 0] },
    scale: [1, 1.15, 0.95, 1.1, 1],
    rotate: [0, 30, -15, 45, 0],
    zIndex: -15,
  },

  // ========================================
  // LAYER 2: Mid-far background
  // ========================================
  {
    id: 'red-mid-far',
    color: MQ_RED,
    position: { bottom: '-15%', right: '-10%' },
    size: { width: '55vw', height: '55vh' },
    opacity: 0.45,
    blur: 100,
    duration: 70,
    amplitude: { x: [0, -60, 40, -30, 0], y: [0, -40, 30, -50, 0] },
    scale: [1, 0.95, 1.12, 0.98, 1],
    rotate: [0, -25, 15, -35, 0],
    zIndex: -14,
  },
  {
    id: 'charcoal-mid-far',
    color: CHARCOAL,
    position: { top: '35%', left: '25%' },
    size: { width: '45vw', height: '45vh' },
    opacity: 0.35,
    blur: 110,
    duration: 80,
    amplitude: { x: [0, 50, -60, 35, 0], y: [0, -55, 40, -30, 0] },
    scale: [1, 1.08, 0.92, 1.05, 1],
    rotate: [0, 20, -30, 25, 0],
    zIndex: -13,
  },

  // ========================================
  // LAYER 3: Mid background
  // ========================================
  {
    id: 'navy-mid',
    color: MQ_NAVY_LIGHT,
    position: { top: '50%', right: '20%' },
    size: { width: '40vw', height: '40vh' },
    opacity: 0.4,
    blur: 80,
    duration: 55,
    amplitude: { x: [0, -45, 55, -40, 0], y: [0, 45, -35, 50, 0] },
    scale: [1, 1.1, 0.9, 1.08, 1],
    rotate: [0, -40, 20, -30, 0],
    zIndex: -12,
  },
  {
    id: 'red-mid',
    color: MQ_RED_LIGHT,
    position: { top: '10%', right: '30%' },
    size: { width: '35vw', height: '35vh' },
    opacity: 0.35,
    blur: 85,
    duration: 60,
    amplitude: { x: [0, 55, -45, 35, 0], y: [0, -35, 55, -40, 0] },
    scale: [1, 0.92, 1.1, 0.95, 1],
    rotate: [0, 35, -25, 40, 0],
    zIndex: -11,
  },

  // ========================================
  // LAYER 4: Near-mid background (faster)
  // ========================================
  {
    id: 'gold-accent',
    color: GOLD,
    position: { bottom: '25%', left: '15%' },
    size: { width: '30vw', height: '30vh' },
    opacity: 0.25,
    blur: 70,
    duration: 45,
    amplitude: { x: [0, 70, -40, 50, 0], y: [0, 30, -60, 40, 0] },
    scale: [1, 1.15, 0.88, 1.12, 1],
    rotate: [0, -50, 30, -40, 0],
    zIndex: -10,
  },
  {
    id: 'navy-near',
    color: MQ_NAVY_LIGHT,
    position: { bottom: '40%', right: '5%' },
    size: { width: '25vw', height: '25vh' },
    opacity: 0.3,
    blur: 60,
    duration: 40,
    amplitude: { x: [0, -55, 45, -35, 0], y: [0, -45, 35, -55, 0] },
    scale: [1, 1.08, 0.95, 1.1, 1],
    rotate: [0, 45, -35, 50, 0],
    zIndex: -9,
  },

  // ========================================
  // LAYER 5: Foreground accents (fastest)
  // ========================================
  {
    id: 'red-near',
    color: MQ_RED_LIGHT,
    position: { top: '60%', left: '60%' },
    size: { width: '20vw', height: '20vh' },
    opacity: 0.2,
    blur: 50,
    duration: 35, // Fastest - nearest layer
    amplitude: { x: [0, 40, -50, 30, 0], y: [0, 50, -40, 45, 0] },
    scale: [1, 1.12, 0.9, 1.15, 1],
    rotate: [0, -55, 40, -45, 0],
    zIndex: -8,
  },
];

// ============================================================================
// BLOB COMPONENT
// ============================================================================

interface BlobProps {
  config: BlobConfig;
  prefersReducedMotion: boolean | null;
  isDarkMode: boolean;
}

// Map light mode colors to dark mode colors
const getDarkModeColor = (lightColor: string): string => {
  if (lightColor === MQ_NAVY) return MQ_NAVY_DARK_MODE;
  if (lightColor === MQ_NAVY_LIGHT) return MQ_NAVY_LIGHT_DARK_MODE;
  if (lightColor === MQ_RED) return MQ_RED_DARK_MODE;
  if (lightColor === MQ_RED_LIGHT) return MQ_RED_LIGHT_DARK_MODE;
  if (lightColor === CHARCOAL) return CHARCOAL_DARK_MODE;
  if (lightColor === GOLD) return GOLD_DARK_MODE;
  return lightColor;
};

const Blob = memo(({ config, prefersReducedMotion, isDarkMode }: BlobProps) => {
  const color = isDarkMode ? getDarkModeColor(config.color) : config.color;
  const blendMode = isDarkMode ? 'screen' : 'multiply';
  // Increase opacity slightly in dark mode for visibility
  const opacity = isDarkMode ? Math.min(config.opacity * 1.3, 0.6) : config.opacity;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    ...config.position,
    width: config.size.width,
    height: config.size.height,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    borderRadius: '50%',
    filter: `blur(${config.blur}px)`,
    opacity: opacity,
    zIndex: config.zIndex,
    willChange: prefersReducedMotion ? 'auto' : 'transform',
    mixBlendMode: blendMode,
  };

  // Static rendering for reduced motion or SSR
  if (prefersReducedMotion) {
    return <div style={baseStyle} aria-hidden="true" />;
  }

  return (
    <m.div
      style={baseStyle}
      aria-hidden="true"
      animate={{
        x: config.amplitude.x,
        y: config.amplitude.y,
        scale: config.scale,
        rotate: config.rotate,
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    />
  );
});

Blob.displayName = 'Blob';

// ============================================================================
// MOVING MESH BACKGROUND COMPONENT
// ============================================================================

interface MovingMeshBackgroundProps {
  /** Custom className for the container */
  className?: string;
  /** Override default blob configs */
  customBlobs?: BlobConfig[];
  /** Disable animations (force static) */
  forceStatic?: boolean;
}

/**
 * MovingMeshBackground Component
 *
 * Creates a layered parallax background with animated gradient blobs.
 * The different animation speeds create depth perception and make
 * liquid glass refraction effects visible.
 *
 * Blob layers (from far to near):
 * 1. Far background (90s duration) - Navy primary
 * 2. Mid-far (70-80s) - Red, Charcoal
 * 3. Mid (55-60s) - Navy light, Red light
 * 4. Near-mid (40-45s) - Gold accent, Navy accent
 * 5. Foreground (35s) - Red accent (fastest, most parallax)
 */
const MovingMeshBackground = memo(
  ({ className, customBlobs, forceStatic = false }: MovingMeshBackgroundProps) => {
    // Framer Motion's built-in reduced motion detection
    const prefersReducedMotion = useReducedMotion();

    // Client-side detection to prevent hydration mismatch
    const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

    // Dark mode detection for blend mode switching
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      // Initial check
      const checkDarkMode = () => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      };
      checkDarkMode();

      // Watch for theme changes via class mutation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            checkDarkMode();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }, []);

    const blobs = customBlobs || BLOB_CONFIGS;
    const shouldAnimate = isClient && !forceStatic && !prefersReducedMotion;

    return (
      <LazyMotion features={domAnimation}>
        <div
          className={`moving-mesh-background ${className || ''}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -20,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'var(--c-background, #edeade)',
          }}
          aria-hidden="true"
        >
          {blobs.map((config) => (
            <Blob
              key={config.id}
              config={config}
              prefersReducedMotion={!shouldAnimate}
              isDarkMode={isDarkMode}
            />
          ))}

          {/* Subtle noise overlay for texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: 0.03,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        </div>
      </LazyMotion>
    );
  },
);

MovingMeshBackground.displayName = 'MovingMeshBackground';

export default MovingMeshBackground;

// ============================================================================
// EXPORTS
// ============================================================================
export { BLOB_CONFIGS, MQ_NAVY, MQ_RED };
export type { BlobConfig, MovingMeshBackgroundProps };
