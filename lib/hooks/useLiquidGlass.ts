// lib/hooks/useLiquidGlass.ts
// ============================================================================
// LIQUID GLASS HOOK
// ============================================================================
// Custom hook for creating dynamic liquid glass effects with custom dimensions.
// Uses physics-based refraction calculations from Snell's Law.
//
// USAGE:
// const { filterId, filterElement } = useLiquidGlass({
//   width: 200,
//   height: 100,
//   cornerRadius: 20,
//   surfaceType: 'squircle',
// });
//
// return (
//   <>
//     {filterElement}
//     <div style={{ filter: `url(#${filterId})` }}>Content</div>
//   </>
// );
// ============================================================================
'use client';

import { useMemo, useId, createElement } from 'react';
import type { ReactNode } from 'react';
import {
  generateCircularDisplacementMap,
  generateRoundedRectDisplacementMap,
  generateSpecularMap,
  type SurfaceType,
} from '@/components/ui/LiquidFilter';

interface UseLiquidGlassOptions {
  /** Width of the element (for rounded rect) */
  width?: number;
  /** Height of the element (for rounded rect) */
  height?: number;
  /** Corner radius for rounded rectangles */
  cornerRadius?: number;
  /** Surface type for refraction calculation */
  surfaceType?: SurfaceType;
  /** Bezel width as fraction of radius (0-1) */
  bezelWidth?: number;
  /** Glass thickness multiplier */
  thickness?: number;
  /** Specular highlight intensity (0-1) */
  specularIntensity?: number;
  /** Light angle for specular highlight in degrees */
  lightAngle?: number;
  /** Whether to include specular highlight */
  includeSpecular?: boolean;
  /** Use circular shape instead of rounded rect */
  circular?: boolean;
  /** Size for circular shape */
  size?: number;
}

interface UseLiquidGlassResult {
  /** The filter ID to use in CSS filter property */
  filterId: string;
  /** The SVG filter element to render */
  filterElement: ReactNode;
  /** The displacement map data URL */
  displacementMapUrl: string;
  /** The specular map data URL (if enabled) */
  specularMapUrl: string | null;
  /** Maximum displacement in pixels */
  maxDisplacement: number;
}

/**
 * Hook for creating custom liquid glass effects
 * Generates displacement maps dynamically based on element dimensions
 */
export function useLiquidGlass({
  width = 256,
  height = 256,
  cornerRadius = 20,
  surfaceType = 'squircle',
  bezelWidth = 0.4,
  thickness = 1.0,
  specularIntensity = 0.6,
  lightAngle = -45,
  includeSpecular = true,
  circular = false,
  size = 256,
}: UseLiquidGlassOptions = {}): UseLiquidGlassResult {
  const uniqueId = useId();
  const filterId = `liquid-glass-${uniqueId.replace(/:/g, '')}`;

  const displacementMap = useMemo(() => {
    if (typeof window === 'undefined') {
      return { dataUrl: '', maxDisplacement: 20, width: 256, height: 256 };
    }

    if (circular) {
      return generateCircularDisplacementMap(size, surfaceType, bezelWidth, thickness);
    }

    return generateRoundedRectDisplacementMap(
      width,
      height,
      cornerRadius,
      surfaceType,
      bezelWidth,
      thickness,
    );
  }, [circular, size, width, height, cornerRadius, surfaceType, bezelWidth, thickness]);

  const specularMapUrl = useMemo(() => {
    if (!includeSpecular || typeof window === 'undefined') {
      return null;
    }

    const mapSize = circular ? size : Math.max(width, height);
    return generateSpecularMap(mapSize, surfaceType, bezelWidth, lightAngle, specularIntensity);
  }, [
    includeSpecular,
    circular,
    size,
    width,
    height,
    surfaceType,
    bezelWidth,
    lightAngle,
    specularIntensity,
  ]);

  const filterElement = useMemo((): ReactNode => {
    if (!displacementMap.dataUrl) {
      return null;
    }

    // Build filter children
    const filterChildren: ReactNode[] = [
      // Displacement map image
      createElement('feImage', {
        key: 'displacement',
        href: displacementMap.dataUrl,
        x: '0',
        y: '0',
        width: '100%',
        height: '100%',
        preserveAspectRatio: 'none',
        result: 'displacement_map',
      }),
      // Displacement map filter
      createElement('feDisplacementMap', {
        key: 'refraction',
        in: 'SourceGraphic',
        in2: 'displacement_map',
        scale: displacementMap.maxDisplacement,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'refracted',
      }),
    ];

    // Add specular if enabled
    if (specularMapUrl) {
      filterChildren.push(
        createElement('feImage', {
          key: 'specular',
          href: specularMapUrl,
          x: '0',
          y: '0',
          width: '100%',
          height: '100%',
          preserveAspectRatio: 'none',
          result: 'specular_map',
        }),
        createElement('feBlend', {
          key: 'blend',
          in: 'specular_map',
          in2: 'refracted',
          mode: 'screen',
        }),
      );
    }

    // Create filter element
    const filter = createElement(
      'filter',
      {
        id: filterId,
        x: '-50%',
        y: '-50%',
        width: '200%',
        height: '200%',
        colorInterpolationFilters: 'sRGB',
      },
      ...filterChildren,
    );

    // Create defs element
    const defs = createElement('defs', { key: 'defs' }, filter);

    // Create SVG element
    return createElement(
      'svg',
      {
        'aria-hidden': true,
        style: {
          position: 'absolute' as const,
          width: 0,
          height: 0,
          overflow: 'hidden' as const,
          pointerEvents: 'none' as const,
        },
      },
      defs,
    );
  }, [filterId, displacementMap, specularMapUrl]);

  return {
    filterId,
    filterElement,
    displacementMapUrl: displacementMap.dataUrl,
    specularMapUrl,
    maxDisplacement: displacementMap.maxDisplacement,
  };
}

/**
 * Preset configurations for common use cases
 */
export const LIQUID_GLASS_PRESETS = {
  /** Standard glass panel (Apple default) */
  panel: {
    surfaceType: 'squircle' as SurfaceType,
    bezelWidth: 0.4,
    thickness: 1.0,
    specularIntensity: 0.6,
    lightAngle: -45,
  },
  /** Magnifying glass effect */
  magnifier: {
    surfaceType: 'circle' as SurfaceType,
    bezelWidth: 0.6,
    thickness: 1.5,
    specularIntensity: 0.8,
    lightAngle: -30,
  },
  /** Switch/toggle (lip surface) */
  toggle: {
    surfaceType: 'lip' as SurfaceType,
    bezelWidth: 0.5,
    thickness: 1.0,
    specularIntensity: 0.4,
    lightAngle: -45,
  },
  /** Concave/bowl effect */
  bowl: {
    surfaceType: 'concave' as SurfaceType,
    bezelWidth: 0.5,
    thickness: 0.8,
    specularIntensity: 0.3,
    lightAngle: -60,
  },
  /** Subtle effect for buttons */
  button: {
    surfaceType: 'squircle' as SurfaceType,
    bezelWidth: 0.3,
    thickness: 0.5,
    specularIntensity: 0.4,
    lightAngle: -45,
  },
} as const;

export type LiquidGlassPreset = keyof typeof LIQUID_GLASS_PRESETS;
