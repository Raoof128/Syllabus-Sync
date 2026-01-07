import { describe, it, expect } from 'vitest';
import { buildings, getBuildingById, searchBuildings, type Building } from '@/lib/map/buildings';

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

  it('should not have duplicate positions', () => {
    const positions = buildings.map((b) => `${b.position[0]},${b.position[1]}`);
    const uniquePositions = new Set(positions);
    expect(positions.length).toBe(uniquePositions.size);
  });
});

describe('getBuildingById', () => {
  it('should return a building when given a valid ID', () => {
    const building = getBuildingById('C5C');
    expect(building).toBeDefined();
    expect(building?.id).toBe('C5C');
    expect(building?.name).toBe('Computer Science Building');
  });

  it('should return undefined for invalid ID', () => {
    const building = getBuildingById('INVALID_ID');
    expect(building).toBeUndefined();
  });

  it('should be case-sensitive', () => {
    const building = getBuildingById('c5c');
    expect(building).toBeUndefined();
  });
});

describe('searchBuildings', () => {
  it('should find buildings by name', () => {
    const results = searchBuildings('Library');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((b) => b.name.toLowerCase().includes('library'))).toBe(true);
  });

  it('should find buildings by ID', () => {
    const results = searchBuildings('C5C');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('C5C');
  });

  it('should find buildings by tag', () => {
    const results = searchBuildings('academic');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((building) => {
      expect(building.tags?.includes('academic')).toBe(true);
    });
  });

  it('should find buildings by description', () => {
    const results = searchBuildings('computer science');
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
