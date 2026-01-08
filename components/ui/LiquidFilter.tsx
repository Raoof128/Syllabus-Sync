// components/ui/LiquidFilter.tsx
// ============================================================================
// LIQUID GLASS REFRACTION ENGINE (2025 Edition)
// ============================================================================
// Physics-based implementation of Apple's Liquid Glass effect using:
// - Snell's Law for accurate light refraction calculations
// - Pre-calculated displacement maps based on surface geometry
// - Specular highlights as rim light effects
//
// Based on: "Liquid Glass in the Browser: Refraction with CSS and SVG"
// Reference: Apple WWDC 2025 Liquid Glass design language
//
// USAGE:
// 1. Add <LiquidFilter /> once in your root layout (client-layout.tsx)
// 2. Apply filter: url(#mq-liquid-glass) to elements
// 3. For backdrop effect (Chrome only): backdrop-filter: url(#mq-liquid-glass)
//
// SURFACE TYPES:
// - Squircle: Apple's preferred smooth transition (default)
// - Circle: Spherical dome, sharper edges
// - Concave: Bowl-like depression, rays diverge outward
// - Lip: Raised rim with shallow center (for switches)
//
// PERFORMANCE:
// - Displacement maps are pre-calculated and cached
// - GPU-accelerated via SVG filters
// - Respects prefers-reduced-motion
// ============================================================================
'use client';

import { memo, useMemo, useSyncExternalStore } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

// Refractive indices (Snell's Law)
const REFRACTIVE_INDEX_AIR = 1.0;
const REFRACTIVE_INDEX_GLASS = 1.5;

// Displacement map resolution (8-bit = 256 values, centered at 128)
const DISPLACEMENT_SAMPLES = 127;
const NEUTRAL_VALUE = 128;

// Default filter parameters
const DEFAULT_BEZEL_WIDTH = 0.35; // 35% of radius is bezel - slightly less for subtler effect
const DEFAULT_GLASS_THICKNESS = 0.8; // Normalized thickness - reduced for more realistic refraction
const DEFAULT_DISPLACEMENT_SCALE = 15; // Base displacement scale in pixels

// ============================================================================
// SURFACE FUNCTIONS
// ============================================================================
// These define the height profile of the glass surface from edge (x=0) to
// flat interior (x=1). The derivative gives us the surface normal for
// refraction calculations.

type SurfaceType = 'squircle' | 'circle' | 'concave' | 'lip';

/**
 * Convex Squircle - Apple's preferred surface
 * y = fourth-root(1 - (1-x)^4)
 * Provides the smoothest flat-to-curve transition
 */
const squircleSurface = (x: number): number => {
  const t = 1 - x;
  return Math.pow(1 - Math.pow(t, 4), 0.25);
};

/**
 * Convex Circle - Spherical dome
 * y = sqrt(1 - (1-x)^2)
 * Simpler but has harsher transition at edges
 */
const circleSurface = (x: number): number => {
  const t = 1 - x;
  return Math.sqrt(1 - t * t);
};

/**
 * Concave - Bowl-like depression
 * y = 1 - convex(x)
 * Causes rays to diverge outward (magnifying effect)
 */
const concaveSurface = (x: number): number => {
  return 1 - squircleSurface(x);
};

/**
 * Smootherstep interpolation for lip surface
 * Provides smooth transition between convex and concave
 */
const smootherstep = (x: number): number => {
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/**
 * Lip - Raised rim with shallow center dip
 * mix(convex, concave, smootherstep(x))
 * Used for switch/toggle components
 */
const lipSurface = (x: number): number => {
  const convex = squircleSurface(x);
  const concave = concaveSurface(x);
  const t = smootherstep(x);
  return convex * (1 - t) + concave * t;
};

const SURFACE_FUNCTIONS: Record<SurfaceType, (x: number) => number> = {
  squircle: squircleSurface,
  circle: circleSurface,
  concave: concaveSurface,
  lip: lipSurface,
};

// ============================================================================
// REFRACTION PHYSICS (Snell's Law)
// ============================================================================

/**
 * Calculate surface normal at a point using numerical derivative
 */
const calculateNormal = (
  surfaceFn: (x: number) => number,
  x: number,
  delta: number = 0.001,
): { x: number; y: number } => {
  const y1 = surfaceFn(Math.max(0, x - delta));
  const y2 = surfaceFn(Math.min(1, x + delta));
  const derivative = (y2 - y1) / (2 * delta);

  // Normal is perpendicular to tangent (rotate by -90 degrees)
  // Tangent is (1, derivative), so normal is (-derivative, 1)
  const length = Math.sqrt(derivative * derivative + 1);
  return {
    x: -derivative / length,
    y: 1 / length,
  };
};

/**
 * Calculate angle of incidence from surface normal
 * Incident rays are assumed to be vertical (coming straight down)
 */
const calculateIncidenceAngle = (normal: { x: number; y: number }): number => {
  // Incident ray is (0, -1) (pointing down)
  // Angle with normal is acos(dot product)
  // dot((0, -1), (nx, ny)) = -ny
  return Math.acos(Math.abs(normal.y));
};

/**
 * Apply Snell's Law to calculate refraction angle
 * n1 * sin(theta1) = n2 * sin(theta2)
 */
const calculateRefractionAngle = (
  incidenceAngle: number,
  n1: number = REFRACTIVE_INDEX_AIR,
  n2: number = REFRACTIVE_INDEX_GLASS,
): number => {
  const sinTheta1 = Math.sin(incidenceAngle);
  const sinTheta2 = (n1 / n2) * sinTheta1;

  // Check for total internal reflection
  if (Math.abs(sinTheta2) > 1) {
    return incidenceAngle; // Total internal reflection
  }

  return Math.asin(sinTheta2);
};

/**
 * Calculate displacement magnitude at a distance from the edge
 * Based on the difference between incident and refracted ray positions
 */
const calculateDisplacement = (
  distanceFromEdge: number,
  surfaceFn: (x: number) => number,
  thickness: number = DEFAULT_GLASS_THICKNESS,
): number => {
  if (distanceFromEdge <= 0 || distanceFromEdge >= 1) {
    return 0;
  }

  const normal = calculateNormal(surfaceFn, distanceFromEdge);
  const incidenceAngle = calculateIncidenceAngle(normal);
  const refractionAngle = calculateRefractionAngle(incidenceAngle);

  // Calculate horizontal displacement based on angles and glass height
  const height = surfaceFn(distanceFromEdge) * thickness;

  // Displacement is the difference in x position after passing through glass
  const displacement = height * (Math.tan(incidenceAngle) - Math.tan(refractionAngle));

  // Sign depends on which side of the normal we're on
  return displacement * Math.sign(normal.x);
};

// ============================================================================
// DISPLACEMENT MAP GENERATION
// ============================================================================

interface DisplacementMapData {
  dataUrl: string;
  maxDisplacement: number;
  width: number;
  height: number;
}

/**
 * Generate a circular displacement map for the liquid glass effect
 * Returns a data URL that can be used in feImage
 */
const generateCircularDisplacementMap = (
  size: number,
  surfaceType: SurfaceType = 'squircle',
  bezelWidth: number = DEFAULT_BEZEL_WIDTH,
  thickness: number = DEFAULT_GLASS_THICKNESS,
): DisplacementMapData => {
  const surfaceFn = SURFACE_FUNCTIONS[surfaceType];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { dataUrl: '', maxDisplacement: 0, width: size, height: size };
  }

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const center = size / 2;
  const radius = center;

  // Pre-calculate displacement magnitudes along radius
  const displacements: number[] = [];
  for (let i = 0; i <= DISPLACEMENT_SAMPLES; i++) {
    const t = i / DISPLACEMENT_SAMPLES; // 0 to 1 (edge to interior)
    const displacement = calculateDisplacement(t, surfaceFn, thickness);
    displacements.push(displacement);
  }

  // Find maximum displacement for normalization
  const maxDisplacement = Math.max(...displacements.map(Math.abs), 0.001);

  // Generate displacement map
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = distance / radius;

      let r = NEUTRAL_VALUE;
      let g = NEUTRAL_VALUE;

      if (normalizedDistance <= 1) {
        // Calculate distance from edge (0 at edge, 1 at center after bezel)
        const distanceFromEdge = 1 - normalizedDistance;
        const bezelPosition = Math.min(distanceFromEdge / bezelWidth, 1);

        // Get displacement magnitude from pre-calculated array
        const sampleIndex = Math.floor(bezelPosition * DISPLACEMENT_SAMPLES);
        const displacement = displacements[Math.min(sampleIndex, DISPLACEMENT_SAMPLES)];

        // Normalize and convert to direction
        const normalizedDisplacement = displacement / maxDisplacement;

        if (distance > 0) {
          // Direction is radial (pointing toward/away from center)
          const dirX = dx / distance;
          const dirY = dy / distance;

          // Apply displacement in radial direction
          const dispX = dirX * normalizedDisplacement;
          const dispY = dirY * normalizedDisplacement;

          // Convert to 8-bit values (128 = no displacement)
          r = Math.round(NEUTRAL_VALUE + dispX * 127);
          g = Math.round(NEUTRAL_VALUE + dispY * 127);
        }
      }

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, r)); // R - X displacement
      data[idx + 1] = Math.max(0, Math.min(255, g)); // G - Y displacement
      data[idx + 2] = NEUTRAL_VALUE; // B - unused
      data[idx + 3] = 255; // A - fully opaque
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    maxDisplacement: maxDisplacement * bezelWidth * radius,
    width: size,
    height: size,
  };
};

/**
 * Generate a rounded rectangle displacement map
 * Stretches a circular displacement map into a rounded rectangle
 */
const generateRoundedRectDisplacementMap = (
  width: number,
  height: number,
  cornerRadius: number,
  surfaceType: SurfaceType = 'squircle',
  bezelWidth: number = DEFAULT_BEZEL_WIDTH,
  thickness: number = DEFAULT_GLASS_THICKNESS,
): DisplacementMapData => {
  const surfaceFn = SURFACE_FUNCTIONS[surfaceType];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { dataUrl: '', maxDisplacement: 0, width, height };
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Pre-calculate displacement magnitudes
  const displacements: number[] = [];
  for (let i = 0; i <= DISPLACEMENT_SAMPLES; i++) {
    const t = i / DISPLACEMENT_SAMPLES;
    const displacement = calculateDisplacement(t, surfaceFn, thickness);
    displacements.push(displacement);
  }

  const maxDisplacement = Math.max(...displacements.map(Math.abs), 0.001);
  const bezelPixels = cornerRadius * bezelWidth;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distance to nearest edge (rounded rectangle SDF)
      const distToLeft = x;
      const distToRight = width - 1 - x;
      const distToTop = y;
      const distToBottom = height - 1 - y;

      // Handle corners specially
      let distanceFromEdge: number;
      let dirX = 0;
      let dirY = 0;

      const inLeftCornerZone = x < cornerRadius;
      const inRightCornerZone = x >= width - cornerRadius;
      const inTopCornerZone = y < cornerRadius;
      const inBottomCornerZone = y >= height - cornerRadius;

      if ((inLeftCornerZone || inRightCornerZone) && (inTopCornerZone || inBottomCornerZone)) {
        // Corner region - use circular distance
        const cornerX = inLeftCornerZone ? cornerRadius : width - cornerRadius;
        const cornerY = inTopCornerZone ? cornerRadius : height - cornerRadius;
        const dx = x - cornerX;
        const dy = y - cornerY;
        const distFromCorner = Math.sqrt(dx * dx + dy * dy);
        distanceFromEdge = cornerRadius - distFromCorner;

        if (distFromCorner > 0) {
          dirX = -dx / distFromCorner;
          dirY = -dy / distFromCorner;
        }
      } else {
        // Edge region - use straight distance
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        distanceFromEdge = minDist;

        if (minDist === distToLeft) {
          dirX = 1;
          dirY = 0;
        } else if (minDist === distToRight) {
          dirX = -1;
          dirY = 0;
        } else if (minDist === distToTop) {
          dirX = 0;
          dirY = 1;
        } else {
          dirX = 0;
          dirY = -1;
        }
      }

      let r = NEUTRAL_VALUE;
      let g = NEUTRAL_VALUE;

      if (distanceFromEdge >= 0 && distanceFromEdge < bezelPixels) {
        const bezelPosition = distanceFromEdge / bezelPixels;
        const sampleIndex = Math.floor(bezelPosition * DISPLACEMENT_SAMPLES);
        const displacement = displacements[Math.min(sampleIndex, DISPLACEMENT_SAMPLES)];
        const normalizedDisplacement = displacement / maxDisplacement;

        const dispX = dirX * normalizedDisplacement;
        const dispY = dirY * normalizedDisplacement;

        r = Math.round(NEUTRAL_VALUE + dispX * 127);
        g = Math.round(NEUTRAL_VALUE + dispY * 127);
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = NEUTRAL_VALUE;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    maxDisplacement: maxDisplacement * bezelPixels,
    width,
    height,
  };
};

// ============================================================================
// SPECULAR HIGHLIGHT GENERATION
// ============================================================================

/**
 * Generate a rim light specular highlight map
 * Intensity varies based on surface normal angle relative to light direction
 */
const generateSpecularMap = (
  size: number,
  surfaceType: SurfaceType = 'squircle',
  bezelWidth: number = DEFAULT_BEZEL_WIDTH,
  lightAngle: number = -45, // degrees from top
  intensity: number = 0.6,
): string => {
  const surfaceFn = SURFACE_FUNCTIONS[surfaceType];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const center = size / 2;
  const radius = center;

  // Light direction (normalized)
  const lightRad = (lightAngle * Math.PI) / 180;
  const lightDir = {
    x: Math.sin(lightRad),
    y: -Math.cos(lightRad),
    z: 0.5, // Slight elevation
  };
  const lightLen = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
  lightDir.x /= lightLen;
  lightDir.y /= lightLen;
  lightDir.z /= lightLen;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = distance / radius;

      let alpha = 0;

      if (normalizedDistance <= 1 && normalizedDistance > 0) {
        const distanceFromEdge = 1 - normalizedDistance;
        const bezelPosition = Math.min(distanceFromEdge / bezelWidth, 1);

        if (bezelPosition < 1) {
          // Get surface normal
          const normal2D = calculateNormal(surfaceFn, bezelPosition);

          // Extend to 3D normal (radial direction in xy plane)
          const radialX = dx / distance;
          const radialY = dy / distance;

          const normal3D = {
            x: radialX * normal2D.x,
            y: radialY * normal2D.x,
            z: normal2D.y,
          };

          // Calculate specular reflection
          const dot = normal3D.x * lightDir.x + normal3D.y * lightDir.y + normal3D.z * lightDir.z;
          const specular = Math.pow(Math.max(0, dot), 30); // Shininess exponent

          // Rim light effect - stronger at edges
          const rimFactor = 1 - bezelPosition;
          alpha = Math.round(specular * rimFactor * intensity * 255);
        }
      }

      const idx = (y * size + x) * 4;
      data[idx] = 255; // R - white highlight
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      data[idx + 3] = Math.max(0, Math.min(255, alpha)); // A - intensity
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

// ============================================================================
// REDUCED MOTION DETECTION
// ============================================================================

const subscribeToReducedMotion = (callback: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getReducedMotionServerSnapshot = () => false;

// ============================================================================
// LIQUID FILTER COMPONENT
// ============================================================================

interface LiquidFilterProps {
  /** Size of the displacement map in pixels */
  mapSize?: number;
  /** Width of the bezel as fraction of radius (0-1) */
  bezelWidth?: number;
  /** Glass thickness multiplier */
  thickness?: number;
  /** Specular highlight intensity (0-1) */
  specularIntensity?: number;
  /** Light angle for specular highlight in degrees */
  lightAngle?: number;
  /** Base displacement scale in pixels */
  displacementScale?: number;
}

const LiquidFilter = memo(
  ({
    mapSize = 256,
    bezelWidth = DEFAULT_BEZEL_WIDTH,
    thickness = DEFAULT_GLASS_THICKNESS,
    specularIntensity = 0.5,
    lightAngle = -45,
    displacementScale = DEFAULT_DISPLACEMENT_SCALE,
  }: LiquidFilterProps) => {
    const prefersReducedMotion = useSyncExternalStore(
      subscribeToReducedMotion,
      getReducedMotionSnapshot,
      getReducedMotionServerSnapshot,
    );

    // Generate displacement maps for each surface type
    const squircleMap = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return generateCircularDisplacementMap(mapSize, 'squircle', bezelWidth, thickness);
    }, [mapSize, bezelWidth, thickness]);

    const circleMap = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return generateCircularDisplacementMap(mapSize, 'circle', bezelWidth, thickness);
    }, [mapSize, bezelWidth, thickness]);

    const concaveMap = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return generateCircularDisplacementMap(mapSize, 'concave', bezelWidth, thickness);
    }, [mapSize, bezelWidth, thickness]);

    const lipMap = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return generateCircularDisplacementMap(mapSize, 'lip', bezelWidth, thickness);
    }, [mapSize, bezelWidth, thickness]);

    // Generate specular highlight maps
    const specularMap = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return generateSpecularMap(mapSize, 'squircle', bezelWidth, lightAngle, specularIntensity);
    }, [mapSize, bezelWidth, lightAngle, specularIntensity]);

    // Don't render complex filters for users who prefer reduced motion
    if (prefersReducedMotion) {
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
            {/* Simple blur fallback for reduced motion */}
            <filter id="mq-liquid-glass" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} />
            </filter>
            <filter id="mq-liquid-squircle" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} />
            </filter>
            <filter id="mq-liquid-circle" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} />
            </filter>
            <filter id="mq-liquid-concave" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} />
            </filter>
            <filter id="mq-liquid-lip" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} />
            </filter>
            <filter id="mq-liquid-subtle" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={1} />
            </filter>
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
    }

    // Wait for client-side map generation
    if (!squircleMap || !circleMap || !concaveMap || !lipMap || !specularMap) {
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
            PRIMARY LIQUID GLASS FILTER - Squircle (Apple Default)
            ================================================================
            Physics-based refraction using Snell's Law with squircle surface.
            This is Apple's preferred surface for smooth transitions.
            ================================================================ */}
          <filter
            id="mq-liquid-glass"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            {/* Load pre-calculated displacement map */}
            <feImage
              href={squircleMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />

            {/* Apply physics-based refraction with controlled scale */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(squircleMap.maxDisplacement, displacementScale)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />

            {/* Load specular highlight map */}
            <feImage
              href={specularMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="specular_map"
            />

            {/* Composite specular highlight on top */}
            <feBlend in="specular_map" in2="refracted" mode="screen" result="with_highlight" />
          </filter>

          {/* Alias for backward compatibility */}
          <filter
            id="mq-liquid-squircle"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={squircleMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(squircleMap.maxDisplacement, displacementScale)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />
            <feImage
              href={specularMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="specular_map"
            />
            <feBlend in="specular_map" in2="refracted" mode="screen" />
          </filter>

          {/* ================================================================
            CIRCLE SURFACE FILTER
            ================================================================
            Spherical dome surface - sharper refraction at edges.
            ================================================================ */}
          <filter
            id="mq-liquid-circle"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={circleMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(circleMap.maxDisplacement, displacementScale * 1.2)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ================================================================
            CONCAVE SURFACE FILTER
            ================================================================
            Bowl-like depression - rays diverge outward (magnifying).
            ================================================================ */}
          <filter
            id="mq-liquid-concave"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={concaveMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(concaveMap.maxDisplacement, displacementScale * 0.8)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ================================================================
            LIP SURFACE FILTER
            ================================================================
            Raised rim with shallow center - for switches/toggles.
            ================================================================ */}
          <filter
            id="mq-liquid-lip"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={lipMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(lipMap.maxDisplacement, displacementScale * 0.6)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ================================================================
            SUBTLE LIQUID FILTER (for smaller elements)
            ================================================================
            Gentler version with reduced displacement scale.
            ================================================================ */}
          <filter
            id="mq-liquid-subtle"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={squircleMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(squircleMap.maxDisplacement * 0.5, displacementScale * 0.4)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ================================================================
            GLOW FILTER (for bloom effects)
            ================================================================ */}
          <filter id="mq-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ================================================================
            RED GLOW FILTER (for MQ branding on hover)
            ================================================================ */}
          <filter id="mq-red-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0.65 0 0 0 0
                      0.1 0 0 0 0
                      0.18 0 0 0 0
                      0 0 0 1 0"
              result="colored_blur"
            />
            <feMerge>
              <feMergeNode in="colored_blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ================================================================
            LEGACY FILTER ID (backward compatibility)
            ================================================================ */}
          <filter
            id="mq-liquid-distortion"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={squircleMap.dataUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={Math.min(squircleMap.maxDisplacement, displacementScale)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />
            <feImage
              href={specularMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="specular_map"
            />
            <feBlend in="specular_map" in2="refracted" mode="screen" />
          </filter>
        </defs>
      </svg>
    );
  },
);

LiquidFilter.displayName = 'LiquidFilter';

export default LiquidFilter;

// ============================================================================
// EXPORTS FOR CUSTOM USAGE
// ============================================================================
export {
  generateCircularDisplacementMap,
  generateRoundedRectDisplacementMap,
  generateSpecularMap,
  calculateDisplacement,
  SURFACE_FUNCTIONS,
  REFRACTIVE_INDEX_AIR,
  REFRACTIVE_INDEX_GLASS,
};

export type { SurfaceType, DisplacementMapData, LiquidFilterProps };
