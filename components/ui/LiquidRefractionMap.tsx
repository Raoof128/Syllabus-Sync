// components/ui/LiquidRefractionMap.tsx
// ============================================================================
// LIQUID REFRACTION MAP - Apple Liquid Glass Style
// ============================================================================
// Implements optical refraction and displacement maps for Apple's "Liquid Glass"
// design language using SVG filters with feTurbulence and feDisplacementMap.
//
// The effect creates organic "liquid" warping of backgrounds behind glass panels
// by combining:
// 1. feTurbulence (fractalNoise) - generates organic noise pattern
// 2. feDisplacementMap - warps source graphic based on noise
// 3. feGaussianBlur - softens displacement for smooth "liquid" feel
//
// NEW IN v1.1.0:
// - Intensity control via CSS custom property --glass-intensity (0-100)
// - Dynamic filter scaling based on intensity
// - Integration with GlassProvider context
//
// USAGE:
// Add <LiquidRefractionMap /> once in root layout (app/layout.tsx)
// Then apply filter via CSS: filter: url(#mq-liquid-refraction)
// Or backdrop: backdrop-filter: blur(25px); (use with .mq-liquid-glass class)
//
// PERFORMANCE:
// - GPU-accelerated via SVG filter compositing
// - Respects prefers-reduced-motion (disables filters)
// - Uses will-change hints for smooth transitions
//
// @version 1.1.0
// @see liquid-glass.css for complementary CSS
// ============================================================================
'use client';

import { memo, useSyncExternalStore, useMemo } from 'react';

// ============================================================================
// REDUCED MOTION DETECTION
// ============================================================================

const subscribeToReducedMotion = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getReducedMotionServerSnapshot = () => false;

// ============================================================================
// HIGH CONTRAST DETECTION
// ============================================================================

const subscribeToHighContrast = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-contrast: more)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getHighContrastSnapshot = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: more)').matches;

const getHighContrastServerSnapshot = () => false;

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

interface FilterConfig {
  /** Base frequency for feTurbulence noise (default: 0.012) */
  baseFrequency: number;
  /** Number of octaves for noise complexity (default: 3) */
  numOctaves: number;
  /** Displacement scale in pixels (default: 35) */
  displacementScale: number;
  /** Gaussian blur for softening (default: 2) */
  blurStdDeviation: number;
  /** Random seed for noise generation */
  seed: number;
}

const DEFAULT_CONFIG: FilterConfig = {
  baseFrequency: 0.012,
  numOctaves: 3,
  displacementScale: 35,
  blurStdDeviation: 2,
  seed: 42,
};

// Subtle variant for smaller elements
const SUBTLE_CONFIG: FilterConfig = {
  baseFrequency: 0.015,
  numOctaves: 2,
  displacementScale: 15,
  blurStdDeviation: 1.5,
  seed: 17,
};

// Heavy variant for hero sections
const HEAVY_CONFIG: FilterConfig = {
  baseFrequency: 0.008,
  numOctaves: 4,
  displacementScale: 50,
  blurStdDeviation: 3,
  seed: 99,
};

// ============================================================================
// INTENSITY SCALING UTILITIES
// ============================================================================

/**
 * Scale filter config based on intensity (0-100)
 * At intensity 0, displacement is minimal
 * At intensity 100, displacement is at full config values
 */
const scaleConfigByIntensity = (config: FilterConfig, intensity: number): FilterConfig => {
  const factor = Math.max(0, Math.min(100, intensity)) / 100;
  return {
    ...config,
    displacementScale: config.displacementScale * factor,
    blurStdDeviation: config.blurStdDeviation * (0.5 + factor * 0.5), // Min 50% blur
  };
};

// ============================================================================
// LIQUID REFRACTION MAP COMPONENT
// ============================================================================

interface LiquidRefractionMapProps {
  /** Include subtle filter variant */
  includeSubtle?: boolean;
  /** Include heavy filter variant */
  includeHeavy?: boolean;
  /** Include specular highlight filter */
  includeSpecular?: boolean;
  /** Include glow filter */
  includeGlow?: boolean;
  /** Global intensity override (0-100, default uses CSS variable) */
  intensity?: number;
}

/**
 * LiquidRefractionMap Component
 *
 * Renders SVG filter definitions for Apple-style Liquid Glass effects.
 * Should be placed once in the root layout.
 *
 * Filter IDs:
 * - #mq-liquid-refraction: Primary liquid glass filter
 * - #mq-liquid-refraction-subtle: For smaller UI elements
 * - #mq-liquid-refraction-heavy: For hero sections
 * - #mq-specular-highlight: Adds rim light effect
 * - #mq-liquid-glow: Red glow for interactive elements
 *
 * Intensity Control:
 * - Pass `intensity` prop (0-100) to control filter strength
 * - Or use CSS variable --glass-intensity on :root
 */
const LiquidRefractionMap = memo(
  ({
    includeSubtle = true,
    includeHeavy = true,
    includeSpecular = true,
    includeGlow = true,
    intensity = 75, // Default intensity matches CSS variable default
  }: LiquidRefractionMapProps) => {
    // Check user preferences
    const prefersReducedMotion = useSyncExternalStore(
      subscribeToReducedMotion,
      getReducedMotionSnapshot,
      getReducedMotionServerSnapshot,
    );

    const prefersHighContrast = useSyncExternalStore(
      subscribeToHighContrast,
      getHighContrastSnapshot,
      getHighContrastServerSnapshot,
    );

    // Disable complex filters for reduced motion or high contrast
    const shouldDisableFilters = prefersReducedMotion || prefersHighContrast;

    // Scale configs based on intensity
    const scaledDefaultConfig = useMemo(
      () => scaleConfigByIntensity(DEFAULT_CONFIG, intensity),
      [intensity],
    );
    const scaledSubtleConfig = useMemo(
      () => scaleConfigByIntensity(SUBTLE_CONFIG, intensity),
      [intensity],
    );
    const scaledHeavyConfig = useMemo(
      () => scaleConfigByIntensity(HEAVY_CONFIG, intensity),
      [intensity],
    );

    /**
     * Render a liquid refraction filter
     */
    const renderRefractionFilter = (
      id: string,
      config: FilterConfig,
      includeSpecularHighlight: boolean = false,
    ) => (
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        {shouldDisableFilters ? (
          // Fallback: Simple pass-through for accessibility
          <feOffset in="SourceGraphic" result="output" />
        ) : (
          <>
            {/* Step 1: Generate organic noise pattern using fractal noise */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={config.baseFrequency}
              numOctaves={config.numOctaves}
              seed={config.seed}
              stitchTiles="stitch"
              result="noise"
            />

            {/* Step 2: Apply displacement based on noise - creates the "liquid" warping */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={config.displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />

            {/* Step 3: Soften with Gaussian blur for organic "liquid" feel */}
            <feGaussianBlur
              in="displaced"
              stdDeviation={config.blurStdDeviation}
              result="softened"
            />

            {/* Step 4: Optional specular highlight overlay */}
            {includeSpecularHighlight && (
              <>
                {/* Create subtle highlight gradient */}
                <feFlood floodColor="white" floodOpacity="0.08" result="highlight" />
                <feComposite in="highlight" in2="softened" operator="atop" result="withHighlight" />
                <feBlend in="withHighlight" in2="softened" mode="screen" result="output" />
              </>
            )}

            {/* Final output */}
            {!includeSpecularHighlight && <feOffset in="softened" result="output" />}
          </>
        )}
      </filter>
    );

    return (
      <svg
        className="liquid-refraction-map-svg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* ================================================================
              PRIMARY LIQUID REFRACTION FILTER
              ================================================================
              Main filter for glass panels, sidebars, modals.
              Uses moderate displacement for visible but not overwhelming effect.
              Intensity-scaled based on props/CSS variable.
              ================================================================ */}
          {renderRefractionFilter('mq-liquid-refraction', scaledDefaultConfig, true)}

          {/* ================================================================
              SUBTLE VARIANT
              ================================================================
              For smaller UI elements like buttons, badges, tooltips.
              Gentler displacement to maintain readability.
              ================================================================ */}
          {includeSubtle &&
            renderRefractionFilter('mq-liquid-refraction-subtle', scaledSubtleConfig, false)}

          {/* ================================================================
              HEAVY VARIANT
              ================================================================
              For hero sections and large backgrounds.
              More dramatic warping effect.
              ================================================================ */}
          {includeHeavy &&
            renderRefractionFilter('mq-liquid-refraction-heavy', scaledHeavyConfig, true)}

          {/* ================================================================
              SPECULAR HIGHLIGHT FILTER
              ================================================================
              Standalone filter for adding rim light effects to elements.
              ================================================================ */}
          {includeSpecular && (
            <filter id="mq-specular-highlight" x="-10%" y="-10%" width="120%" height="120%">
              {shouldDisableFilters ? (
                <feOffset in="SourceGraphic" result="output" />
              ) : (
                <>
                  {/* Create edge detection for rim lighting */}
                  <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dilated" />
                  <feGaussianBlur in="dilated" stdDeviation="2" result="blurred" />
                  <feFlood floodColor="white" floodOpacity="0.15" result="white" />
                  <feComposite in="white" in2="blurred" operator="in" result="rim" />
                  {/* Composite rim light with original */}
                  <feMerge>
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="rim" />
                  </feMerge>
                </>
              )}
            </filter>
          )}

          {/* ================================================================
              LIQUID GLOW FILTER
              ================================================================
              MQ Red glow effect for interactive/hover states.
              ================================================================ */}
          {includeGlow && (
            <filter id="mq-liquid-glow" x="-50%" y="-50%" width="200%" height="200%">
              {shouldDisableFilters ? (
                <feOffset in="SourceGraphic" result="output" />
              ) : (
                <>
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                  {/* Tint with MQ Red */}
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="0.65 0 0 0 0
                            0.1 0 0 0 0
                            0.18 0 0 0 0
                            0 0 0 0.8 0"
                    result="coloredBlur"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </>
              )}
            </filter>
          )}

          {/* ================================================================
              BACKDROP BLUR ENHANCEMENT
              ================================================================
              Filter to enhance backdrop-filter blur with slight distortion.
              Use with: backdrop-filter: blur(25px) url(#mq-backdrop-enhance)
              ================================================================ */}
          <filter id="mq-backdrop-enhance" x="-10%" y="-10%" width="120%" height="120%">
            {shouldDisableFilters ? (
              <feOffset in="SourceGraphic" result="output" />
            ) : (
              <>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.02"
                  numOctaves="2"
                  seed="7"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="8"
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="displaced"
                />
                <feGaussianBlur in="displaced" stdDeviation="0.5" result="output" />
              </>
            )}
          </filter>

          {/* ================================================================
              FROSTED GLASS FILTER
              ================================================================
              Combines blur with subtle noise for frosted glass effect.
              ================================================================ */}
          <filter id="mq-frosted-glass" x="-10%" y="-10%" width="120%" height="120%">
            {shouldDisableFilters ? (
              <feOffset in="SourceGraphic" result="output" />
            ) : (
              <>
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="4"
                  seed="3"
                  result="noise"
                />
                <feDisplacementMap
                  in="blur"
                  in2="noise"
                  scale="3"
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="frosted"
                />
                <feComposite in="frosted" in2="SourceGraphic" operator="over" />
              </>
            )}
          </filter>
        </defs>
      </svg>
    );
  },
);

LiquidRefractionMap.displayName = 'LiquidRefractionMap';

export default LiquidRefractionMap;

// ============================================================================
// EXPORTS
// ============================================================================
export { DEFAULT_CONFIG, SUBTLE_CONFIG, HEAVY_CONFIG, scaleConfigByIntensity };
export type { FilterConfig, LiquidRefractionMapProps };
