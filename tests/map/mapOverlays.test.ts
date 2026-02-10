import { describe, it, expect } from 'vitest';
import {
  MAP_OVERLAY_IDS,
  mapOverlays,
  mapOverlayById,
  normaliseOverlayIds,
} from '@/features/map/lib/mapOverlays';
import { parseOverlaysFromURL, overlaysToURLParam } from '@/lib/store/mapStore';

describe('mapOverlays registry', () => {
  it('MAP_OVERLAY_IDS matches mapOverlays order', () => {
    expect(mapOverlays.map((o) => o.id)).toEqual([...MAP_OVERLAY_IDS]);
  });

  it('mapOverlayById contains all overlays', () => {
    for (const id of MAP_OVERLAY_IDS) {
      expect(mapOverlayById.get(id)).toBeDefined();
      expect(mapOverlayById.get(id)!.id).toBe(id);
    }
  });
});

describe('normaliseOverlayIds', () => {
  it('returns empty array for empty input', () => {
    expect(normaliseOverlayIds([])).toEqual([]);
  });

  it('filters out invalid IDs', () => {
    expect(normaliseOverlayIds(['parking', 'bogus', 'exam'])).toEqual(['parking']);
  });

  it('removes duplicates', () => {
    expect(normaliseOverlayIds(['parking', 'parking', 'accessibility'])).toEqual([
      'parking',
      'accessibility',
    ]);
  });

  it('orders by registry position regardless of input order', () => {
    expect(normaliseOverlayIds(['special_permits', 'parking', 'drinking_water'])).toEqual([
      'parking',
      'drinking_water',
      'special_permits',
    ]);
  });

  it('handles all valid IDs', () => {
    expect(
      normaliseOverlayIds(['special_permits', 'accessibility', 'drinking_water', 'parking']),
    ).toEqual([...MAP_OVERLAY_IDS]);
  });
});

describe('URL helpers', () => {
  it('parseOverlaysFromURL returns empty for no layers param', () => {
    const params = new URLSearchParams('');
    expect(parseOverlaysFromURL(params)).toEqual([]);
  });

  it('parseOverlaysFromURL parses valid IDs in registry order', () => {
    const params = new URLSearchParams('layers=accessibility,parking');
    expect(parseOverlaysFromURL(params)).toEqual(['parking', 'accessibility']);
  });

  it('parseOverlaysFromURL ignores invalid IDs', () => {
    const params = new URLSearchParams('layers=parking,invalid,exam');
    expect(parseOverlaysFromURL(params)).toEqual(['parking']);
  });

  it('overlaysToURLParam returns stable ordered string', () => {
    expect(overlaysToURLParam(['accessibility', 'parking'])).toBe('parking,accessibility');
  });

  it('overlaysToURLParam returns empty string for no overlays', () => {
    expect(overlaysToURLParam([])).toBe('');
  });
});
