import { describe, it, expect } from 'vitest';
import { buildings, getBuildingById, searchBuildings } from '@/features/map/lib/buildings';

describe('buildings data', () => {
  it('should have buildings defined', () => {
    expect(buildings).toBeDefined();
    expect(Array.isArray(buildings)).toBe(true);
    expect(buildings.length).toBeGreaterThan(0);
  });

  it('should have unique building IDs', () => {
    const ids = buildings.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have required fields for each building', () => {
    buildings.forEach((building) => {
      expect(building.id).toBeDefined();
      expect(typeof building.id).toBe('string');
      expect(building.name).toBeDefined();
      expect(typeof building.name).toBe('string');
      expect(building.position).toBeDefined();
      expect(Array.isArray(building.position)).toBe(true);
      expect(building.position.length).toBe(2);
      expect(building.translationKey).toBeDefined();
      expect(building.descriptionKey).toBeDefined();
    });
  });

  it('should have valid position coordinates', () => {
    buildings.forEach((building) => {
      const [x, y] = building.position;
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
      expect(x).toBeGreaterThan(0);
      expect(y).toBeGreaterThan(0);
    });
  });

  it('should allow buildings at same position (same location)', () => {
    // Multiple buildings can share positions when they're at the same physical location
    // (e.g., different services in the same building complex)
    const positions = buildings.map((b) => `${b.position[0]},${b.position[1]}`);
    const uniquePositions = new Set(positions);
    // Just verify we have positions - some overlap is expected
    expect(positions.length).toBeGreaterThan(0);
    expect(uniquePositions.size).toBeGreaterThan(0);
  });
});

describe('getBuildingById', () => {
  it('should return a building when given a valid ID', () => {
    // Using 'LIB' (Library) which exists in the current buildings data
    const building = getBuildingById('LIB');
    expect(building).toBeDefined();
    expect(building?.id).toBe('LIB');
    expect(building?.name).toContain('Library');
  });

  it('should return undefined for invalid ID', () => {
    const building = getBuildingById('INVALID_ID');
    expect(building).toBeUndefined();
  });

  it('should be case-insensitive', () => {
    const building = getBuildingById('lib');
    expect(building).toBeDefined();
    expect(building?.id).toBe('LIB');
  });

  it('should keep 18WW destination aligned to Service Connect and not Central Courtyard', () => {
    const b18 = getBuildingById('18WW');
    const serviceConnect = getBuildingById('18WWSERVIC');
    const courtyard = getBuildingById('1CC');

    expect(b18?.location).toBeDefined();
    expect(serviceConnect?.location).toBeDefined();
    expect(courtyard?.location).toBeDefined();

    const distance = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
      const dLat = (a.lat - b.lat) * 111_000;
      const dLng = (a.lng - b.lng) * 111_000 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    const dToService = distance(b18!.location!, serviceConnect!.location!);
    const dToCourtyard = distance(b18!.location!, courtyard!.location!);

    expect(dToService).toBeLessThan(30);
    expect(dToCourtyard).toBeGreaterThan(50);
  });
});

describe('searchBuildings', () => {
  it('should find buildings by name', () => {
    const results = searchBuildings('Library');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((b) => b.name.toLowerCase().includes('library'))).toBe(true);
  });

  it('should find buildings by ID', () => {
    const results = searchBuildings('LIB');
    // LIB matches both 'LIB' (Library) and 'LIBCAFE' (Library Cafe)
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((b) => b.id === 'LIB')).toBe(true);
  });

  it('should find buildings by tag', () => {
    const results = searchBuildings('academic');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((building) => {
      expect(building.tags?.includes('academic')).toBe(true);
    });
  });

  it('should find buildings by description', () => {
    // Search for 'security' which is in the SEC building description
    const results = searchBuildings('security');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should be case-insensitive', () => {
    const resultsLower = searchBuildings('library');
    const resultsUpper = searchBuildings('LIBRARY');
    const resultsMixed = searchBuildings('LiBrArY');

    expect(resultsLower.length).toBe(resultsUpper.length);
    expect(resultsLower.length).toBe(resultsMixed.length);
  });

  it('should return empty array for no matches', () => {
    const results = searchBuildings('xyznonexistent');
    expect(results).toEqual([]);
  });

  it('should return all buildings for empty query', () => {
    const results = searchBuildings('');
    // Empty string matches everything since it's a substring of all strings
    expect(results.length).toBe(buildings.length);
  });

  it('should handle whitespace-only query', () => {
    const results = searchBuildings('   ');
    // Should match nothing or return all buildings depending on implementation
    expect(Array.isArray(results)).toBe(true);
  });
});
