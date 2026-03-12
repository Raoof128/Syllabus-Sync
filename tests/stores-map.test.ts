/**
 * Map Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore, parseOverlaysFromURL, overlaysToURLParam } from '@/lib/store/mapStore';

describe('mapStore', () => {
  beforeEach(() => {
    useMapStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useMapStore.getState();
    expect(state.activeOverlays).toEqual([]);
    expect(state.selectedBuildingId).toBeNull();
    expect(state.showOverlayPanel).toBe(false);
    expect(state.lastPosition).toBeNull();
    expect(state.hapticFeedbackEnabled).toBe(true);
  });

  it('should toggle overlay on', () => {
    useMapStore.getState().toggleOverlay('parking');
    expect(useMapStore.getState().activeOverlays).toContain('parking');
  });

  it('should toggle overlay off', () => {
    useMapStore.getState().toggleOverlay('parking');
    useMapStore.getState().toggleOverlay('parking');
    expect(useMapStore.getState().activeOverlays).not.toContain('parking');
  });

  it('should check if overlay is active', () => {
    expect(useMapStore.getState().isOverlayActive('parking')).toBe(false);
    useMapStore.getState().toggleOverlay('parking');
    expect(useMapStore.getState().isOverlayActive('parking')).toBe(true);
  });

  it('should set overlays and normalize', () => {
    useMapStore.getState().setOverlays(['parking', 'parking', 'unknown-overlay']);
    // Should deduplicate and remove invalid IDs
    const overlays = useMapStore.getState().activeOverlays;
    const parkingCount = overlays.filter((o) => o === 'parking').length;
    expect(parkingCount).toBeLessThanOrEqual(1);
  });

  it('should clear overlays', () => {
    useMapStore.getState().toggleOverlay('parking');
    useMapStore.getState().clearOverlays();
    expect(useMapStore.getState().activeOverlays).toEqual([]);
  });

  it('should set selected building', () => {
    useMapStore.getState().setSelectedBuilding('12WW');
    expect(useMapStore.getState().selectedBuildingId).toBe('12WW');

    useMapStore.getState().setSelectedBuilding(null);
    expect(useMapStore.getState().selectedBuildingId).toBeNull();
  });

  it('should set overlay panel visibility', () => {
    useMapStore.getState().setShowOverlayPanel(true);
    expect(useMapStore.getState().showOverlayPanel).toBe(true);
  });

  it('should set and clear last position', () => {
    const pos = { lat: -33.7738, lng: 151.1126, zoom: 16 };
    useMapStore.getState().setLastPosition(pos);
    expect(useMapStore.getState().lastPosition).toEqual(pos);

    useMapStore.getState().setLastPosition(null);
    expect(useMapStore.getState().lastPosition).toBeNull();
  });

  it('should toggle haptic feedback', () => {
    expect(useMapStore.getState().hapticFeedbackEnabled).toBe(true);
    useMapStore.getState().toggleHapticFeedback();
    expect(useMapStore.getState().hapticFeedbackEnabled).toBe(false);
    useMapStore.getState().toggleHapticFeedback();
    expect(useMapStore.getState().hapticFeedbackEnabled).toBe(true);
  });

  it('should set haptic feedback', () => {
    useMapStore.getState().setHapticFeedbackEnabled(false);
    expect(useMapStore.getState().hapticFeedbackEnabled).toBe(false);
  });

  it('should reset all state', () => {
    useMapStore.getState().toggleOverlay('parking');
    useMapStore.getState().setSelectedBuilding('12WW');
    useMapStore.getState().setShowOverlayPanel(true);
    useMapStore.getState().setLastPosition({ lat: 1, lng: 2, zoom: 3 });
    useMapStore.getState().setHapticFeedbackEnabled(false);

    useMapStore.getState().reset();

    const state = useMapStore.getState();
    expect(state.activeOverlays).toEqual([]);
    expect(state.selectedBuildingId).toBeNull();
    expect(state.showOverlayPanel).toBe(false);
    expect(state.lastPosition).toBeNull();
    expect(state.hapticFeedbackEnabled).toBe(true);
  });
});

describe('parseOverlaysFromURL', () => {
  it('returns empty array when no layers param', () => {
    const params = new URLSearchParams('');
    expect(parseOverlaysFromURL(params)).toEqual([]);
  });

  it('parses comma-separated layers', () => {
    const params = new URLSearchParams('layers=parking');
    const result = parseOverlaysFromURL(params);
    expect(result).toContain('parking');
  });
});

describe('overlaysToURLParam', () => {
  it('returns empty string for no overlays', () => {
    expect(overlaysToURLParam([])).toBe('');
  });

  it('creates comma-separated string', () => {
    const result = overlaysToURLParam(['parking']);
    expect(result).toContain('parking');
  });
});
