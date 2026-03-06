import type { Building } from '@/features/map/lib/buildings';

export const normalizeForSearch = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const buildSearchableFields = (building: Building, translatedName?: string): string[] =>
  [
    building.id,
    building.name,
    translatedName,
    building.description,
    building.gridRef,
    building.address,
    ...(building.aliases ?? []),
    ...(building.searchTokens ?? []),
    ...(building.tags ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeForSearch(String(value)));

export function searchCampusBuildings(
  buildings: Building[],
  query: string,
  getTranslatedName?: (building: Building) => string,
): Building[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) {
    return [...buildings];
  }

  return [...buildings].sort((left, right) => {
    const leftTranslated = getTranslatedName?.(left);
    const rightTranslated = getTranslatedName?.(right);

    const leftScore = scoreBuildingMatch(left, normalizedQuery, leftTranslated);
    const rightScore = scoreBuildingMatch(right, normalizedQuery, rightTranslated);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return left.id.localeCompare(right.id);
  });
}

function scoreBuildingMatch(
  building: Building,
  normalizedQuery: string,
  translatedName?: string,
): number {
  const fields = buildSearchableFields(building, translatedName);
  const id = normalizeForSearch(building.id);
  const aliases = [...(building.aliases ?? []), ...(building.searchTokens ?? [])].map(
    normalizeForSearch,
  );

  if (id === normalizedQuery) return 120;
  if (aliases.includes(normalizedQuery)) return 110;
  if (fields.some((field) => field === normalizedQuery)) return 100;
  if (id.startsWith(normalizedQuery)) return 90;
  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) return 80;
  if (fields.some((field) => field.startsWith(normalizedQuery))) return 70;
  if (fields.some((field) => field.includes(normalizedQuery))) return 50;

  return 0;
}
