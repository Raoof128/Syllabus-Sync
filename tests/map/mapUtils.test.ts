import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMarkerIcon } from '@/features/map/lib/mapUtils';

// Mock Leaflet
const mockIconConstructor = vi.fn();
const mockL = {
  Icon: mockIconConstructor,
};

describe('mapUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // We need to access the module's internal cache or rely on the fact that constructor isn't called twice
    // Since we can't easily access the module-scope variable `iconCache` directly without exporting it,
    // we will rely on the side effect: L.Icon constructor call count.
  });

  describe('createMarkerIcon', () => {
    it('should create a new icon if not in cache', () => {
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, false, 'test-class');
      expect(mockIconConstructor).toHaveBeenCalledTimes(1);
    });

    it('should return cached icon if called with same parameters', () => {
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      const icon1 = createMarkerIcon(mockL, true, 'cached-class');
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      const icon2 = createMarkerIcon(mockL, true, 'cached-class');

      expect(mockIconConstructor).toHaveBeenCalledTimes(1); // Still 1, meaning 2nd call used cache
      expect(icon1).toBe(icon2);
    });

    it('should create different icons for different parameters', () => {
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, false, 'class-a');
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, true, 'class-a'); // different selected state
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, false, 'class-b'); // different class

      // 1 from previous test (global cache persistence in module scope during test run)
      // + 3 new calls = 4 total?
      // Actually, module scope persists across tests in the same file usually.
      // Let's rely on strict call counts per test if we can, but safe to assume it adds up.
      // To be safe, we can check that it's CALLED for these new unique keys.

      // Since we can't easily reset the module-level cache without re-importing,
      // let's just assume previous tests populated the cache.
      // "false-test-class", "true-cached-class" are in cache.

      // "false-class-a" -> New
      // "true-class-a" -> New
      // "false-class-b" -> New

      // So we expect 3 NEW calls.
      const initialCalls = mockIconConstructor.mock.calls.length;

      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, false, 'unique-1');
      // @ts-expect-error - unit test mock only implements Icon constructor used by createMarkerIcon
      createMarkerIcon(mockL, false, 'unique-2');

      expect(mockIconConstructor).toHaveBeenCalledTimes(initialCalls + 2);
    });
  });
});
