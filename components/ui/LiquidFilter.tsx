// components/ui/LiquidFilter.tsx
// ============================================================================
// LIQUID GLASS REFRACTION ENGINE
// ============================================================================
// This component provides a global SVG filter that creates organic liquid
// distortion effects. The filter uses feTurbulence for noise generation
// and feDisplacementMap for pixel displacement, creating a "liquid glass"
// refraction effect.
//
// USAGE:
// 1. Add <LiquidFilter /> once in your root layout (client-layout.tsx)
// 2. Apply filter: url(#mq-liquid-distortion) to pseudo-elements
// 3. The filter ID "mq-liquid-distortion" is globally available
//
// PERFORMANCE:
// - GPU-accelerated via will-change hints
// - Uses CSS containment for isolation
// - Respects prefers-reduced-motion
// ============================================================================
'use client';

import { memo, useEffect, useState } from 'react';

/**
 * LiquidFilter Component
 *
 * Renders a hidden SVG with filter definitions that can be referenced
 * by CSS throughout the application. The filter creates a subtle liquid
 * distortion effect that makes glass surfaces appear more organic.
 *
 * Filter Parameters:
 * - baseFrequency: 0.015 (low frequency = large, smooth waves)
 * - numOctaves: 3 (complexity of noise pattern)
 * - scale: 15 (displacement intensity)
 */
const LiquidFilter = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check and listen for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Don't render filter for users who prefer reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <svg
      className="liquid-filter-svg"
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
            PRIMARY LIQUID DISTORTION FILTER
            ================================================================
            Creates organic, flowing distortion effect for glass surfaces.
            - feTurbulence: Generates Perlin noise pattern
            - feDisplacementMap: Uses noise to displace pixels
            ================================================================ */}
        <filter
          id="mq-liquid-distortion"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          {/* Generate turbulence noise pattern */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves={3}
            seed={42}
            stitchTiles="stitch"
            result="noise"
          />
          {/* Apply displacement based on noise pattern */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={15}
            xChannelSelector="R"
            yChannelSelector="G"
            result="distorted"
          />
        </filter>

        {/* ================================================================
            SUBTLE LIQUID FILTER (for smaller elements)
            ================================================================
            A gentler version for buttons and small UI elements.
            ================================================================ */}
        <filter
          id="mq-liquid-subtle"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves={2}
            seed={24}
            stitchTiles="stitch"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={8}
            xChannelSelector="R"
            yChannelSelector="G"
            result="distorted"
          />
        </filter>

        {/* ================================================================
            SECURITY SHIELD FILTER (Navy tinted for Settings)
            ================================================================
            A more intense filter with navy color matrix overlay
            for "encrypted space" visual treatment.
            ================================================================ */}
        <filter
          id="mq-security-shield"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves={4}
            seed={7}
            stitchTiles="stitch"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={12}
            xChannelSelector="R"
            yChannelSelector="G"
            result="distorted"
          />
          {/* Navy tint overlay using color matrix */}
          <feColorMatrix
            in="distorted"
            type="matrix"
            values="
              0.9 0 0 0 0
              0 0.9 0 0 0.02
              0 0 1 0 0.05
              0 0 0 1 0
            "
            result="tinted"
          />
        </filter>

        {/* ================================================================
            GLOW FILTER (for bloom effects on buttons)
            ================================================================ */}
        <filter id="mq-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
});

LiquidFilter.displayName = 'LiquidFilter';

export default LiquidFilter;
