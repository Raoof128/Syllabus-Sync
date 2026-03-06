import { describe, expect, it } from 'vitest';
import { searchCampusBuildings } from '@/lib/maps/buildings/buildingSearch';
import type { Building } from '@/features/map/lib/buildings';

const buildings: Building[] = [
  {
    id: '18WW',
    name: "18 Wally's Walk",
    aliases: ['service connect'],
    searchTokens: ['central hub'],
    position: [0, 0],
    translationKey: 'building_18WW_name',
    descriptionKey: 'building_18WW_desc',
  },
  {
    id: 'LIB',
    name: 'Waranara Library',
    position: [1, 1],
    translationKey: 'building_LIB_name',
    descriptionKey: 'building_LIB_desc',
  },
];

describe('searchCampusBuildings', () => {
  it('prioritises exact building code matches', () => {
    const results = searchCampusBuildings(buildings, 'LIB');
    expect(results[0]?.id).toBe('LIB');
  });

  it('matches aliases and search tokens', () => {
    const aliasResults = searchCampusBuildings(buildings, 'service connect');
    expect(aliasResults[0]?.id).toBe('18WW');

    const tokenResults = searchCampusBuildings(buildings, 'central hub');
    expect(tokenResults[0]?.id).toBe('18WW');
  });

  it('supports translated-name scoring callbacks', () => {
    const results = searchCampusBuildings(buildings, 'waranara', (building) =>
      building.id === 'LIB' ? 'Waranara Library' : building.name,
    );

    expect(results[0]?.id).toBe('LIB');
  });
});
