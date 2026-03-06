import { useMemo } from 'react';
import type { Building } from '@/features/map/lib/buildings';
import { searchCampusBuildings } from '@/lib/maps/buildings/buildingSearch';

interface UseCampusBuildingSearchResult {
  /** Ranked building results (all buildings if query is empty) */
  results: Building[];
  /** Whether the top result is a strong match (score >= 70 i.e. startsWith or better) */
  hasStrongMatch: boolean;
}

export function useCampusBuildingSearch(
  buildings: Building[],
  query: string,
  getTranslatedName?: (building: Building) => string,
): UseCampusBuildingSearchResult {
  return useMemo(() => {
    const results = searchCampusBuildings(buildings, query, getTranslatedName);

    // Determine if the top result is a strong match
    // Strong = the top result has a high relevance score (exact/alias/startsWith match)
    const hasStrongMatch =
      query.trim().length > 0 && results.length > 0 && isStrongMatch(results[0], query);

    return { results, hasStrongMatch };
  }, [buildings, query, getTranslatedName]);
}

/** Check if a building is a strong match for the query (code/alias/name starts with or equals) */
function isStrongMatch(building: Building, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const id = building.id.toLowerCase();
  if (id === q || id.startsWith(q)) return true;

  const name = building.name.toLowerCase();
  if (name === q || name.startsWith(q)) return true;

  const aliases = [...(building.aliases ?? []), ...(building.searchTokens ?? [])];
  if (
    aliases.some((a) => {
      const al = a.toLowerCase();
      return al === q || al.startsWith(q);
    })
  )
    return true;

  return false;
}
