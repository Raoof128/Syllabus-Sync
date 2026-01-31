/**
 * mapUtils.ts - Utility functions for map operations
 *
 * This module contains helper functions for:
 * - Generating SVG marker icons
 * - Creating Leaflet Icon instances
 * - Other map-related utilities
 */

import { BRAND_COLORS } from '@/lib/config';

// Marker icon colors
export const MARKER_COLORS = {
  /** Default marker fill color (Macquarie Red) */
  base: BRAND_COLORS.primary,
  /** Brighter red for selected/active state */
  selected: '#d6001c',
  /** Center dot color (white) */
  center: '#ffffff',
} as const;

// Marker icon dimensions
export const MARKER_DIMENSIONS = {
  width: 25,
  height: 41,
  anchorX: 12,
  anchorY: 41,
  popupAnchorX: 1,
  popupAnchorY: -34,
  shadowWidth: 41,
  shadowHeight: 41,
} as const;

/**
 * Generates an SVG marker icon as a base64 data URL
 *
 * @param options - Configuration for the marker icon
 * @param options.isSelected - Whether the marker is in selected state (uses brighter color)
 * @param options.fillColor - Optional custom fill color (overrides isSelected)
 * @param options.centerColor - Optional custom center dot color
 * @returns Base64 encoded SVG data URL
 */
export function generateMarkerSvgDataUrl(options: {
  isSelected?: boolean;
  fillColor?: string;
  centerColor?: string;
}): string {
  const { isSelected = false, fillColor, centerColor = MARKER_COLORS.center } = options;

  // Determine fill color: custom > selected > base
  const fill = fillColor ?? (isSelected ? MARKER_COLORS.selected : MARKER_COLORS.base);

  const svg = `
    <svg width="${MARKER_DIMENSIONS.width}" height="${MARKER_DIMENSIONS.height}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5s12.5-19.8 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${fill}"/>
      <circle cx="12.5" cy="12.5" r="5" fill="${centerColor}"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Creates a Leaflet Icon instance for map markers
 *
 * @param L - The Leaflet module
 * @param isSelected - Whether the marker is in selected state
 * @param className - Optional CSS class for the marker
 * @returns A Leaflet Icon instance
 */
export function createMarkerIcon(
  L: typeof import('leaflet'),
  isSelected: boolean,
  className?: string,
): import('leaflet').Icon {
  return new L.Icon({
    iconUrl: generateMarkerSvgDataUrl({ isSelected }),
    iconSize: [MARKER_DIMENSIONS.width, MARKER_DIMENSIONS.height],
    iconAnchor: [MARKER_DIMENSIONS.anchorX, MARKER_DIMENSIONS.anchorY],
    popupAnchor: [MARKER_DIMENSIONS.popupAnchorX, MARKER_DIMENSIONS.popupAnchorY],
    shadowUrl: '/images/leaflet/marker-shadow.png',
    shadowSize: [MARKER_DIMENSIONS.shadowWidth, MARKER_DIMENSIONS.shadowHeight],
    className: className,
  });
}

/**
 * Creates a user location indicator icon (pulsing dot with directional flash)
 *
 * @param L - The Leaflet module
 * @returns A Leaflet DivIcon instance
 */
export function createUserLocationIcon(L: typeof import('leaflet')): import('leaflet').DivIcon {
  return L.divIcon({
    className: 'user-location-wrapper',
    // Structure: Container -> Flash (stationary) + Dot (stationary) + Arrow (moving)
    html: `
      <div class="user-location-container">
        <div class="user-heading-flash"></div>
        <div class="user-location-dot"></div>
        <div class="user-motion-arrow"></div>
      </div>
    `,
    iconSize: [48, 48], // Larger area to accommodate the beam
    iconAnchor: [24, 24], // Center point
  });
}
