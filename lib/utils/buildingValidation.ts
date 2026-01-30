/**
 * Building Validation Service
 *
 * Single source of truth for building validation across Calendar and Map.
 * Used by all entity forms (Assignments, Exams, Units, Events, Todos).
 */

import { buildings, type Building } from '@/lib/map/buildings';

// Cache the building lookup map for performance
let buildingMap: Map<string, Building> | null = null;
let buildingNameMap: Map<string, Building> | null = null;

/**
 * Initialize the building lookup maps (lazy initialization)
 */
function ensureBuildingMaps() {
  if (!buildingMap) {
    buildingMap = new Map();
    buildingNameMap = new Map();

    buildings.forEach((building) => {
      // Map by ID (primary key)
      buildingMap!.set(building.id.toLowerCase(), building);

      // Map by name (for user-friendly lookup)
      buildingNameMap!.set(building.name.toLowerCase(), building);

      // Also map by common abbreviations and addresses
      if (building.address) {
        buildingNameMap!.set(building.address.toLowerCase(), building);
      }
    });
  }
}

/**
 * Get all valid buildings for dropdown/autocomplete
 */
export function getAllBuildings(): Building[] {
  return buildings;
}

/**
 * Get building options formatted for select/autocomplete components
 */
export function getBuildingOptions(): { value: string; label: string; description?: string }[] {
  return buildings.map((b) => ({
    value: b.id,
    label: b.name,
    description: b.address || b.description,
  }));
}

/**
 * Validate a building ID or name against the campus building list
 *
 * @param building - Building ID or name to validate
 * @returns The validated Building object, or null if not found
 */
export function validateBuilding(building: string | null | undefined): Building | null {
  if (!building || building.trim() === '') {
    return null;
  }

  ensureBuildingMaps();

  const normalizedInput = building.trim().toLowerCase();

  // First try exact ID match
  if (buildingMap!.has(normalizedInput)) {
    return buildingMap!.get(normalizedInput)!;
  }

  // Then try name match
  if (buildingNameMap!.has(normalizedInput)) {
    return buildingNameMap!.get(normalizedInput)!;
  }

  // Try partial match on ID
  for (const [id, b] of buildingMap!.entries()) {
    if (id.includes(normalizedInput) || normalizedInput.includes(id)) {
      return b;
    }
  }

  // Try partial match on name
  for (const [name, b] of buildingNameMap!.entries()) {
    if (name.includes(normalizedInput)) {
      return b;
    }
  }

  return null;
}

/**
 * Check if a building is valid (exists in the campus list)
 *
 * @param building - Building ID or name to check
 * @returns true if the building exists, false otherwise
 */
export function isValidBuilding(building: string | null | undefined): boolean {
  return validateBuilding(building) !== null;
}

/**
 * Get a normalized building ID from user input
 * Returns the canonical building ID if found, or null if invalid
 *
 * @param building - Building ID or name input
 * @returns Canonical building ID or null
 */
export function normalizeBuildingId(building: string | null | undefined): string | null {
  const validated = validateBuilding(building);
  return validated ? validated.id : null;
}

/**
 * Search buildings by query (for autocomplete)
 *
 * @param query - Search query
 * @param limit - Maximum results to return (default 10)
 * @returns Array of matching buildings
 */
export function searchBuildings(query: string, limit: number = 10): Building[] {
  if (!query || query.trim() === '') {
    return buildings.slice(0, limit);
  }

  const normalizedQuery = query.trim().toLowerCase();

  const matches: { building: Building; score: number }[] = [];

  buildings.forEach((building) => {
    let score = 0;

    // Exact ID match - highest priority
    if (building.id.toLowerCase() === normalizedQuery) {
      score = 100;
    }
    // ID starts with query
    else if (building.id.toLowerCase().startsWith(normalizedQuery)) {
      score = 90;
    }
    // Name starts with query
    else if (building.name.toLowerCase().startsWith(normalizedQuery)) {
      score = 80;
    }
    // ID contains query
    else if (building.id.toLowerCase().includes(normalizedQuery)) {
      score = 70;
    }
    // Name contains query
    else if (building.name.toLowerCase().includes(normalizedQuery)) {
      score = 60;
    }
    // Address contains query
    else if (building.address?.toLowerCase().includes(normalizedQuery)) {
      score = 50;
    }
    // Tags contain query
    else if (building.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
      score = 40;
    }
    // Description contains query
    else if (building.description?.toLowerCase().includes(normalizedQuery)) {
      score = 30;
    }

    if (score > 0) {
      matches.push({ building, score });
    }
  });

  // Sort by score descending, then by name alphabetically
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.building.name.localeCompare(b.building.name);
  });

  return matches.slice(0, limit).map(m => m.building);
}

/**
 * Validation error message for invalid buildings
 */
export const BUILDING_VALIDATION_ERROR =
  'Building not found in the campus list. Please select a valid building.';

/**
 * Type guard for building validation in forms
 */
export type BuildingValidationResult =
  | { valid: true; building: Building }
  | { valid: false; error: string };

/**
 * Validate building with detailed result (for forms)
 */
export function validateBuildingWithResult(building: string | null | undefined): BuildingValidationResult {
  if (!building || building.trim() === '') {
    return { valid: false, error: 'Building is required' };
  }

  const validated = validateBuilding(building);

  if (validated) {
    return { valid: true, building: validated };
  }

  return { valid: false, error: BUILDING_VALIDATION_ERROR };
}
