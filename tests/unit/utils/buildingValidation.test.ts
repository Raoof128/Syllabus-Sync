/**
 * Building Validation Utility Tests
 * Tests building lookup, validation, search, and form integration
 */
import { describe, it, expect } from 'vitest';
import {
  getAllBuildings,
  getBuildingOptions,
  validateBuilding,
  validateBuildingStrict,
  isValidBuilding,
  normalizeBuildingId,
  searchBuildings,
  validateBuildingWithResult,
  BUILDING_VALIDATION_ERROR,
} from '@/lib/utils/buildingValidation';

describe('getAllBuildings', () => {
  it('returns an array of buildings', () => {
    const buildings = getAllBuildings();
    expect(Array.isArray(buildings)).toBe(true);
    expect(buildings.length).toBeGreaterThan(0);
  });

  it('each building has an id and name', () => {
    const buildings = getAllBuildings();
    for (const b of buildings) {
      expect(b.id).toBeDefined();
      expect(b.name).toBeDefined();
    }
  });
});

describe('getBuildingOptions', () => {
  it('returns options with value and label', () => {
    const options = getBuildingOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty('value');
    expect(options[0]).toHaveProperty('label');
  });
});

describe('validateBuilding', () => {
  it('returns null for empty input', () => {
    expect(validateBuilding(null)).toBeNull();
    expect(validateBuilding(undefined)).toBeNull();
    expect(validateBuilding('')).toBeNull();
    expect(validateBuilding('  ')).toBeNull();
  });

  it('finds building by exact ID', () => {
    const buildings = getAllBuildings();
    const firstBuilding = buildings[0];
    const result = validateBuilding(firstBuilding.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(firstBuilding.id);
  });

  it('finds building by name (case-insensitive)', () => {
    const buildings = getAllBuildings();
    const firstBuilding = buildings[0];
    const result = validateBuilding(firstBuilding.name.toUpperCase());
    expect(result).not.toBeNull();
  });

  it('returns null for completely unknown building', () => {
    expect(validateBuilding('ZZZZZ_NONEXISTENT_9999')).toBeNull();
  });
});

describe('validateBuildingStrict', () => {
  it('returns null for empty input', () => {
    expect(validateBuildingStrict('')).toBeNull();
  });

  it('finds exact ID match', () => {
    const buildings = getAllBuildings();
    const first = buildings[0];
    const result = validateBuildingStrict(first.id);
    expect(result).not.toBeNull();
  });

  it('finds exact name match', () => {
    const buildings = getAllBuildings();
    const first = buildings[0];
    const result = validateBuildingStrict(first.name);
    expect(result).not.toBeNull();
  });

  it('does NOT do partial/fuzzy matching', () => {
    // Even if a partial ID might match in non-strict mode
    expect(validateBuildingStrict('ZZZZZ')).toBeNull();
  });
});

describe('isValidBuilding', () => {
  it('returns true for valid buildings', () => {
    const buildings = getAllBuildings();
    expect(isValidBuilding(buildings[0].id)).toBe(true);
  });

  it('returns false for invalid buildings', () => {
    expect(isValidBuilding('NONEXISTENT')).toBe(false);
    expect(isValidBuilding(null)).toBe(false);
    expect(isValidBuilding('')).toBe(false);
  });
});

describe('normalizeBuildingId', () => {
  it('returns canonical ID for valid input', () => {
    const buildings = getAllBuildings();
    const result = normalizeBuildingId(buildings[0].id);
    expect(result).toBe(buildings[0].id);
  });

  it('returns null for invalid input', () => {
    expect(normalizeBuildingId('NONEXISTENT_XYZ')).toBeNull();
    expect(normalizeBuildingId('')).toBeNull();
  });
});

describe('searchBuildings', () => {
  it('returns all buildings (up to limit) for empty query', () => {
    const results = searchBuildings('');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('returns empty query with null-ish values', () => {
    const results = searchBuildings('   ');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('finds buildings by partial name', () => {
    const buildings = getAllBuildings();
    if (buildings.length > 0) {
      // Search using first 3 chars of the first building's name
      const query = buildings[0].name.substring(0, 3);
      const results = searchBuildings(query);
      expect(results.length).toBeGreaterThan(0);
    }
  });

  it('respects limit parameter', () => {
    const results = searchBuildings('', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('sorts by relevance (exact ID match first)', () => {
    const buildings = getAllBuildings();
    if (buildings.length > 0) {
      const results = searchBuildings(buildings[0].id);
      expect(results[0].id).toBe(buildings[0].id);
    }
  });
});

describe('validateBuildingWithResult', () => {
  it('returns error for empty input', () => {
    const result = validateBuildingWithResult('');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Building is required');
    }
  });

  it('returns error for invalid building', () => {
    const result = validateBuildingWithResult('NONEXISTENT_ZZZ');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe(BUILDING_VALIDATION_ERROR);
    }
  });

  it('returns valid result for known building', () => {
    const buildings = getAllBuildings();
    const result = validateBuildingWithResult(buildings[0].id);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.building.id).toBe(buildings[0].id);
    }
  });
});
