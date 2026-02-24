// lib/map/mapOverlays.ts
// Map Overlay Layers — single source of truth for all overlay definitions.

import type { TranslationKey } from '@/lib/i18n/translations';
import { PIXEL_BOUNDS, MAP_ASSET_VERSION } from '@/features/map/lib/constants';

// ─── Overlay IDs (canonical order) ───────────────────────────────────────────
export const MAP_OVERLAY_IDS = [
  'parking',
  'drinking_water',
  'accessibility',
  'special_permits',
] as const;

export type MapOverlayId = (typeof MAP_OVERLAY_IDS)[number];

// ─── Config type ─────────────────────────────────────────────────────────────
export interface MapOverlayConfig {
  id: MapOverlayId;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  type: 'image';
  url: string;
  bounds: [[number, number], [number, number]];
  opacity: number;
  zIndex: number;
  color: string; // Tailwind color class for the UI toggle icon
}

// ─── Registry ────────────────────────────────────────────────────────────────
export const mapOverlays: MapOverlayConfig[] = [
  {
    id: 'parking',
    labelKey: 'overlay_parking_name' as TranslationKey,
    descKey: 'overlay_parking_desc' as TranslationKey,
    type: 'image',
    url: `/maps/overlays/parking_overlay.png?v=${MAP_ASSET_VERSION}`,
    bounds: PIXEL_BOUNDS,
    opacity: 0.92,
    zIndex: 100,
    color: 'text-blue-500',
  },
  {
    id: 'drinking_water',
    labelKey: 'overlay_drinking_water_name' as TranslationKey,
    descKey: 'overlay_drinking_water_desc' as TranslationKey,
    type: 'image',
    url: `/maps/overlays/drinking_water_overlay.png?v=${MAP_ASSET_VERSION}`,
    bounds: PIXEL_BOUNDS,
    opacity: 0.92,
    zIndex: 101,
    color: 'text-cyan-500',
  },
  {
    id: 'accessibility',
    labelKey: 'overlay_accessibility_name' as TranslationKey,
    descKey: 'overlay_accessibility_desc' as TranslationKey,
    type: 'image',
    url: `/maps/overlays/accessibility_overlay.png?v=${MAP_ASSET_VERSION}`,
    bounds: PIXEL_BOUNDS,
    opacity: 0.92,
    zIndex: 102,
    color: 'text-purple-500',
  },
  {
    id: 'special_permits',
    labelKey: 'overlay_special_permits_name' as TranslationKey,
    descKey: 'overlay_special_permits_desc' as TranslationKey,
    type: 'image',
    url: `/maps/overlays/special_permits_overlay.png?v=${MAP_ASSET_VERSION}`,
    bounds: PIXEL_BOUNDS,
    opacity: 0.92,
    zIndex: 103,
    color: 'text-orange-500',
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────
export const mapOverlayById = new Map<MapOverlayId, MapOverlayConfig>(
  mapOverlays.map((o) => [o.id, o]),
);

export const getOverlayById = (id: MapOverlayId): MapOverlayConfig | undefined =>
  mapOverlayById.get(id);

// ─── Normalise overlay IDs ───────────────────────────────────────────────────
// Filters invalid IDs, removes duplicates, orders by registry position.
export function normaliseOverlayIds(ids: string[]): MapOverlayId[] {
  const seen = new Set<MapOverlayId>();
  const result: MapOverlayId[] = [];
  // Walk registry order so output is always deterministic
  for (const registryId of MAP_OVERLAY_IDS) {
    if (ids.includes(registryId) && !seen.has(registryId)) {
      seen.add(registryId);
      result.push(registryId);
    }
  }
  return result;
}
